import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useOrg } from '../../../lib/OrgContext'
import { authApi, orgApi, settingsApi } from '../../../api/client'
import { PRESET_SECURITY_QUESTIONS, CUSTOM_SECURITY_QUESTION_OPTION } from '../../../lib/securityQuestions'
import {
  Step,
  COUNTRY_CODES,
  getBrowserLocation,
  loginSchema,
  signupSchema,
  passwordSchema,
  forgotPasswordPhoneSchema,
  resetPasswordSchema
} from '../utils/auth'

export function useLoginPageState() {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateOrg } = useOrg()
  const [step, setStep] = useState<Step>('login')
  const [country, setCountry] = useState(COUNTRY_CODES[0])

  // If navigated from SignupChoicePage with showSignup state, show signup form
  useEffect(() => {
    if ((location.state as any)?.showSignup) {
      setStep('signup')
    }
  }, [location.state])

  // Login fields
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [secAnswer, setSecAnswer] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')

  // Signup fields - step 1: basic info
  const [suOrgName, setSuOrgName] = useState('')
  const [suOwnerFirstName, setSuOwnerFirstName] = useState('')
  const [suOwnerLastName, setSuOwnerLastName] = useState('')
  const [suPhone, setSuPhone] = useState('')
  // Signup fields - step 2: password (after OTP)
  const [suPassword, setSuPassword] = useState('')
  const [suConfirmPassword, setSuConfirmPassword] = useState('')

  // Post-signup security question setup (optional, skippable)
  const [suSecQuestionChoice, setSuSecQuestionChoice] = useState(PRESET_SECURITY_QUESTIONS[0])
  const [suSecCustomQuestion, setSuSecCustomQuestion] = useState('')
  const [suSecAnswer, setSuSecAnswer] = useState('')
  const [savingSecurityQuestion, setSavingSecurityQuestion] = useState(false)

  // Forgot password fields
  const [forgotPhone, setForgotPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false)

  const [showPw, setShowPw] = useState(false)
  const [showSuPw, setShowSuPw] = useState(false)
  const [showSuConfirmPw, setShowSuConfirmPw] = useState(false)
  const [showCC, setShowCC] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // OTP resend tracking
  const [loginOtpResendsLeft, setLoginOtpResendsLeft] = useState(2)
  const [loginOtpCooldown, setLoginOtpCooldown] = useState(0)
  const [signupOtpResendsLeft, setSignupOtpResendsLeft] = useState(2)
  const [signupOtpCooldown, setSignupOtpCooldown] = useState(0)

  const fullPhone = `${country.code}${phone.replace(/^0/, '')}`
  const fullSuPhone = `${country.code}${suPhone.replace(/^0/, '')}`
  const fullForgotPhone = `${country.code}${forgotPhone.replace(/^0/, '')}`

  const finishLogin = async (tokenData: { access_token: string; refresh_token: { token: string } }) => {
    localStorage.setItem('auth_token', tokenData.access_token)
    localStorage.setItem('refresh_token', tokenData.refresh_token.token)

    try {
      const orgs = await orgApi.getMine()
      if (orgs && orgs.length > 0) {
        const primary = orgs[0]
        localStorage.setItem('org_uuid', primary.uuid)
        
        const verificationStatus = primary.verification_status
          ? (primary.verification_status as 'incomplete' | 'complete')
          : (primary.rc_number ? 'complete' : 'incomplete')

        const approvalStatus = primary.approval_status
          ? (primary.approval_status === 'approved' ? 'approved' : 'pending')
          : (verificationStatus === 'incomplete' ? 'incomplete' : 'pending')
        
        let name = primary.name
        let logoUrl = primary.logo_url ?? null
        let email = undefined
        let phone = undefined
        
        try {
          const settings = await settingsApi.getSettings(primary.uuid) as any
          name = settings.name ?? primary.name
          logoUrl = settings.logo_url ?? primary.logo_url ?? null
          email = settings.contact_email ?? undefined
          phone = settings.contact_phone ?? undefined
        } catch {}

        const cachedProfile = {
          name,
          logoUrl,
          role: 'viewer',
          commissionPct: typeof primary.commission_rate === 'number' ? primary.commission_rate * 100 : 10,
          approvalStatus,
          verificationStatus,
          email,
          phone,
          bankAccounts: [],
          isBalanceHidden: false,
        }
        localStorage.setItem('soole_org_profile', JSON.stringify(cachedProfile))
      }
    } catch (e) {
      console.error('Failed to pre-fetch organization during login:', e)
    }

    toast.success('Welcome back to Soole!')
    navigate('/')
  }

  const handleInitiateForgotPassword = async () => {
    const result = forgotPasswordPhoneSchema.safeParse({ phone: forgotPhone })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }
    setErrors([])
    setLoading(true)
    try {
      await authApi.requestPasswordReset(fullForgotPhone)
      toast.success('Reset code sent to your phone')
      setStep('forgot_password_otp')
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyForgotPasswordOtp = async () => {
    if (otp.length !== 5) return
    setLoading(true)
    try {
      const res = await authApi.verifyResetOtp(fullForgotPhone, otp)
      localStorage.setItem('auth_token', res.data.access_token)
      localStorage.setItem('refresh_token', res.data.refresh_token.token)
      toast.success('Code verified. Set your new password.')
      setStep('forgot_password_reset')
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid or expired reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    const result = resetPasswordSchema.safeParse({ password: newPassword, confirmPassword: confirmNewPassword })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }
    setErrors([])
    setLoading(true)
    try {
      const res = await authApi.resetPassword(fullForgotPhone, newPassword, confirmNewPassword)
      await finishLogin(res.data)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ phone, password })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }
    setErrors([])
    setLoading(true)
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const loginRes = await authApi.directLogin(fullPhone, password, latitude, longitude)

      const sqRes = await authApi.getSecurityQuestionStatus(loginRes.data.access_token)
      if (sqRes.data?.configured && sqRes.data?.question) {
        setSecurityQuestion(sqRes.data.question)
        setStep('security_question')
      } else {
        await finishLogin(loginRes.data)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Login failed. Check your phone number and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async () => {
    if (otp.length !== 5) return
    setLoading(true)
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const res = await authApi.verifyLoginOtp(fullPhone, otp, latitude, longitude)
      if ('requires_security_question' in res.data) {
        setSecurityQuestion(res.data.question)
        setStep('security_question')
      } else {
        await finishLogin(res.data)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityQuestion = async () => {
    if (!secAnswer) return
    setLoading(true)
    try {
      const { latitude, longitude } = await getBrowserLocation()
      const res = await authApi.verifySecurityAnswer(fullPhone, secAnswer, latitude, longitude)
      await finishLogin(res.data)
    } catch (err: any) {
      toast.error(err?.message ?? 'Incorrect answer to security question!')
    } finally {
      setLoading(false)
    }
  }

  const handleResendLoginOtp = async () => {
    setResendLoading(true)
    try {
      const res = await authApi.resendLoginOtp(fullPhone)
      setLoginOtpResendsLeft(res.data.resends_left)
      setLoginOtpCooldown(res.data.seconds_until_next)
      toast.success('OTP resent successfully')
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to resend OTP')
      const message = err?.message || ''
      if (message.includes('wait') || message.includes('Locked')) {
        const match = message.match(/(\d+)m (\d+)s/)
        if (match) {
          const mins = parseInt(match[1] || '0')
          const secs = parseInt(match[2] || '0')
          const totalSeconds = mins * 60 + secs
          setLoginOtpCooldown(totalSeconds)
        }
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleResendSignupOtp = async () => {
    setResendLoading(true)
    try {
      const res = await authApi.resendSignupOtp(fullSuPhone)
      setSignupOtpResendsLeft(res.data.resends_left)
      setSignupOtpCooldown(res.data.seconds_until_next)
      toast.success('OTP resent successfully')
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to resend OTP')
      const message = err?.message || ''
      if (message.includes('wait') || message.includes('Locked')) {
        const match = message.match(/(\d+)m (\d+)s/)
        if (match) {
          const mins = parseInt(match[1] || '0')
          const secs = parseInt(match[2] || '0')
          const totalSeconds = mins * 60 + secs
          setSignupOtpCooldown(totalSeconds)
        }
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignupInitiate = async () => {
    const result = signupSchema.safeParse({ suOrgName, suOwnerFirstName, suOwnerLastName, suPhone })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }

    setErrors([])
    setLoading(true)
    try {
      await authApi.signupOrganizationSendOtp(fullSuPhone)
      toast.success('Verification code sent to your phone')
      setStep('signup_otp')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupOtp = async () => {
    if (otp.length !== 5) return
    setLoading(true)
    try {
      await authApi.verifySignupOtp(fullSuPhone, otp)
      setStep('signup_password')
      setOtp('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupPassword = async () => {
    const result = passwordSchema.safeParse({ suPassword, suConfirmPassword })
    if (!result.success) {
      setErrors(result.error.issues.map(i => i.path[0] as string))
      toast.error(result.error.issues[0].message)
      return
    }

    setErrors([])
    setLoading(true)
    try {
      const res = await authApi.signupOrganization({
        phone: fullSuPhone,
        password: suPassword,
        confirmPassword: suConfirmPassword,
        organizationName: suOrgName,
        organizationType: 'transport_co',
        firstName: suOwnerFirstName,
        lastName: suOwnerLastName,
      })
      localStorage.setItem('auth_token', res.data.token)
      localStorage.setItem('refresh_token', res.data.refreshToken)
      updateOrg({ name: suOrgName, approvalStatus: 'incomplete', verificationStatus: 'incomplete' })
      toast.success('Organization created! Set up security questions.')
      setStep('security_setup')
    } catch (err: any) {
      toast.error(err?.message ?? 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecurityQuestion = async () => {
    const question = suSecQuestionChoice === CUSTOM_SECURITY_QUESTION_OPTION ? suSecCustomQuestion.trim() : suSecQuestionChoice
    if (!question || !suSecAnswer.trim()) {
      toast.error('Enter both a question and an answer')
      return
    }
    setSavingSecurityQuestion(true)
    try {
      await authApi.setSecurityQuestion(question, suSecAnswer.trim())
      toast.success('Security question saved')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save security question')
    } finally {
      setSavingSecurityQuestion(false)
    }
  }

  const getBorderClass = (field: string) =>
    errors.includes(field)
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
      : 'border-neutral-100 focus:border-secondary-300 focus:ring-secondary-300/10'

  return {
    step,
    setStep,
    country,
    setCountry,
    phone,
    setPhone,
    password,
    setPassword,
    otp,
    setOtp,
    secAnswer,
    setSecAnswer,
    securityQuestion,
    setSecurityQuestion,
    suOrgName,
    setSuOrgName,
    suOwnerFirstName,
    setSuOwnerFirstName,
    suOwnerLastName,
    setSuOwnerLastName,
    suPhone,
    setSuPhone,
    suPassword,
    setSuPassword,
    suConfirmPassword,
    setSuConfirmPassword,
    suSecQuestionChoice,
    setSuSecQuestionChoice,
    suSecCustomQuestion,
    setSuSecCustomQuestion,
    suSecAnswer,
    setSuSecAnswer,
    savingSecurityQuestion,
    setSavingSecurityQuestion,
    forgotPhone,
    setForgotPhone,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    showNewPw,
    setShowNewPw,
    showConfirmNewPw,
    setShowConfirmNewPw,
    showPw,
    setShowPw,
    showSuPw,
    setShowSuPw,
    showSuConfirmPw,
    setShowSuConfirmPw,
    showCC,
    setShowCC,
    loading,
    setLoading,
    resendLoading,
    setResendLoading,
    errors,
    setErrors,
    loginOtpResendsLeft,
    setLoginOtpResendsLeft,
    loginOtpCooldown,
    setLoginOtpCooldown,
    signupOtpResendsLeft,
    setSignupOtpResendsLeft,
    signupOtpCooldown,
    setSignupOtpCooldown,
    handleLogin,
    handleOtp,
    handleResendLoginOtp,
    handleResendSignupOtp,
    handleSignupInitiate,
    handleSignupOtp,
    handleSignupPassword,
    handleSaveSecurityQuestion,
    handleSecurityQuestion,
    handleInitiateForgotPassword,
    handleVerifyForgotPasswordOtp,
    handleResetPassword,
    getBorderClass,
  }
}
