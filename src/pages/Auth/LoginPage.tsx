import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { OTPInput } from '../../components/auth/OTPInput'
import { API_BASE_URL } from '../../api/client'

// Modular imports
import { LeftIllustration } from './components/LeftIllustration'
import { AuthHeader } from './components/AuthHeader'
import { SecuritySetup } from './components/SecuritySetup'
import { LoginForm } from './components/LoginForm'
import { SignupForm } from './components/SignupForm'
import { SignupPasswordForm } from './components/SignupPasswordForm'
import { ForgotPasswordFlow } from './components/ForgotPasswordFlow'
import { SecurityVerification } from './components/SecurityVerification'
import { useLoginPageState } from './hooks/useLoginPageState'

export function LoginPage() {
  const navigate = useNavigate()
  const {
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
    resendLoading,
    errors,
    setErrors,
    loginOtpResendsLeft,
    loginOtpCooldown,
    signupOtpResendsLeft,
    signupOtpCooldown,
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
  } = useLoginPageState()

  // The API host (Render free tier) spins down when idle and can take many
  // seconds to wake on the first request. Firing a lightweight, no-auth ping
  // as soon as the login page mounts lets that cold start happen while the
  // user is still typing their phone/password, instead of after they hit
  // Sign in - the response (even an error) is irrelevant, this is only to
  // wake the server up early.
  useEffect(() => {
    fetch(API_BASE_URL).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row">
      <LeftIllustration />

      {/* Right panel */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-white lg:bg-primary-75">
        {/* Form card container */}
        <div className="flex-1 flex items-start lg:items-center justify-center p-1 sm:p-6 lg:p-12 pt-12 sm:pt-6">
          <div className={clsx("w-[85%] mx-auto sm:w-full transition-all duration-300", step === 'signup' ? "max-w-full lg:max-w-lg" : "max-w-full lg:max-w-md mt-6 sm:mt-0")}>

            <div className="bg-white rounded-3xl sm:rounded-card lg:shadow-card p-6 sm:p-8 lg:p-10 relative z-10 w-full mb-8 sm:mb-0 mt-4 sm:mt-0 border border-neutral-100/10">
              {/* Center Logo Header */}
              <div className="flex flex-col items-center text-center mb-6 select-none">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/soole-icon.png" alt="Soole logo" className="w-7 h-7 object-contain" />
                  <span className="text-xl font-bold tracking-tight text-[#042011] font-display">Soole</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#042011] tracking-tight">
                  {(() => {
                    switch (step) {
                      case 'login': return 'Welcome back 👋'
                      case 'signup': return 'Create Account 👋'
                      case 'signup_otp': return 'Verify Phone 📱'
                      case 'signup_password': return 'Create Password 🔒'
                      case 'security_setup': return 'Secure Account 🛡️'
                      case 'security_question': return 'Security Verification 🔑'
                      case 'forgot_password':
                      case 'forgot_password_otp':
                      case 'forgot_password_reset': return 'Reset Password 🔑'
                      default: return 'Verification Required'
                    }
                  })()}
                </h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-[280px] leading-relaxed">
                  {(() => {
                    switch (step) {
                      case 'login': return 'Sign in to access your organization dashboard'
                      case 'signup': return 'Register your company on the Soole platform'
                      case 'signup_otp': return 'Enter the verification code sent via SMS'
                      case 'signup_password': return 'Create a strong password for your new company account'
                      case 'security_setup': return 'Set up a recovery question before continuing'
                      case 'security_question': return 'Please answer your backup security question to continue'
                      case 'forgot_password': return 'Enter your phone number to receive a reset code'
                      case 'forgot_password_otp': return 'Enter the verification code sent to your phone'
                      case 'forgot_password_reset': return 'Create a strong new password for your account'
                      default: return 'Please follow the steps to continue'
                    }
                  })()}
                </p>
              </div>
              {step === 'login' ? (
                <LoginForm
                  phone={phone}
                  setPhone={setPhone}
                  password={password}
                  setPassword={setPassword}
                  country={country}
                  setCountry={setCountry}
                  showCC={showCC}
                  setShowCC={setShowCC}
                  showPw={showPw}
                  setShowPw={setShowPw}
                  errors={errors}
                  setErrors={setErrors}
                  loading={loading}
                  handleLogin={handleLogin}
                  setStep={setStep}
                  getBorderClass={getBorderClass}
                />
              ) : step === 'signup' ? (
                <SignupForm
                  suOwnerFirstName={suOwnerFirstName}
                  setSuOwnerFirstName={setSuOwnerFirstName}
                  suOwnerLastName={suOwnerLastName}
                  setSuOwnerLastName={setSuOwnerLastName}
                  suPhone={suPhone}
                  setSuPhone={setSuPhone}
                  suOrgName={suOrgName}
                  setSuOrgName={setSuOrgName}
                  country={country}
                  setCountry={setCountry}
                  showCC={showCC}
                  setShowCC={setShowCC}
                  errors={errors}
                  setErrors={setErrors}
                  loading={loading}
                  handleSignupInitiate={handleSignupInitiate}
                  setStep={setStep}
                  getBorderClass={getBorderClass}
                />
              ) : step === 'signup_otp' ? (
                <div className="space-y-4">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    onSubmit={handleSignupOtp}
                    onResend={handleResendSignupOtp}
                    loading={loading}
                    resendLoading={resendLoading}
                    resendsLeft={signupOtpResendsLeft}
                    secondsUntilNextResend={signupOtpCooldown}
                    canResend={true}
                    description="We've sent a 5-digit code via SMS to verify your phone number. Please enter it below."
                  />
                  <button onClick={() => { setStep('signup'); setOtp('') }} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    ← Back
                  </button>
                </div>
              ) : step === 'signup_password' ? (
                <SignupPasswordForm
                  suPassword={suPassword}
                  setSuPassword={setSuPassword}
                  suConfirmPassword={suConfirmPassword}
                  setSuConfirmPassword={setSuConfirmPassword}
                  showSuPw={showSuPw}
                  setShowSuPw={setShowSuPw}
                  showSuConfirmPw={showSuConfirmPw}
                  setShowSuConfirmPw={setShowSuConfirmPw}
                  errors={errors}
                  setErrors={setErrors}
                  loading={loading}
                  handleSignupPassword={handleSignupPassword}
                  setStep={setStep}
                  getBorderClass={getBorderClass}
                />
              ) : step === 'otp' ? (
                <div className="space-y-4">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    onSubmit={handleOtp}
                    onResend={handleResendLoginOtp}
                    loading={loading}
                    resendLoading={resendLoading}
                    resendsLeft={loginOtpResendsLeft}
                    secondsUntilNextResend={loginOtpCooldown}
                    canResend={true}
                  />
                  <button onClick={() => { setStep('login'); setOtp('') }} className="w-full text-black font-black rounded-2xl px-4 py-2 hover:bg-primary-75 transition-all text-sm">
                    ← Back to login
                  </button>
                </div>
              ) : step === 'forgot_password' || step === 'forgot_password_otp' || step === 'forgot_password_reset' ? (
                <ForgotPasswordFlow
                  step={step}
                  forgotPhone={forgotPhone}
                  setForgotPhone={setForgotPhone}
                  otp={otp}
                  setOtp={setOtp}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmNewPassword={confirmNewPassword}
                  setConfirmNewPassword={setConfirmNewPassword}
                  showNewPw={showNewPw}
                  setShowNewPw={setShowNewPw}
                  showConfirmNewPw={showConfirmNewPw}
                  setShowConfirmNewPw={setShowConfirmNewPw}
                  errors={errors}
                  setErrors={setErrors}
                  loading={loading}
                  resendLoading={resendLoading}
                  loginOtpResendsLeft={loginOtpResendsLeft}
                  loginOtpCooldown={loginOtpCooldown}
                  country={country}
                  handleInitiateForgotPassword={handleInitiateForgotPassword}
                  handleVerifyForgotPasswordOtp={handleVerifyForgotPasswordOtp}
                  handleResetPassword={handleResetPassword}
                  setStep={setStep}
                  getBorderClass={getBorderClass}
                />
              ) : step === 'security_setup' ? (
                <SecuritySetup
                  suSecQuestionChoice={suSecQuestionChoice}
                  setSuSecQuestionChoice={setSuSecQuestionChoice}
                  suSecCustomQuestion={suSecCustomQuestion}
                  setSuSecCustomQuestion={setSuSecCustomQuestion}
                  suSecAnswer={suSecAnswer}
                  setSuSecAnswer={setSuSecAnswer}
                  savingSecurityQuestion={savingSecurityQuestion}
                  handleSaveSecurityQuestion={handleSaveSecurityQuestion}
                  onSkip={() => navigate('/')}
                />
              ) : (
                <SecurityVerification
                  securityQuestion={securityQuestion}
                  secAnswer={secAnswer}
                  setSecAnswer={setSecAnswer}
                  loading={loading}
                  handleSecurityQuestion={handleSecurityQuestion}
                  setStep={setStep}
                />
              )}
            </div>
            {step === 'login' && (
              <p className="hidden sm:block text-center text-xs text-neutral-200 mt-8 font-medium">Protected by Soole · 2FA required for all organization accounts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
