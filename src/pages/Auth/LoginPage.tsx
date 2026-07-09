import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { OTPInput } from '../../components/auth/OTPInput'

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

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row">
      <LeftIllustration />

      {/* Right panel */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <AuthHeader step={step} securityQuestion={securityQuestion} type="mobile" />

        {/* Form card container */}
        <div className="flex-1 flex items-start lg:items-center justify-center p-1 sm:p-6 lg:p-12 pt-12 sm:pt-6">
          <div className={clsx("w-[85%] mx-auto sm:w-full transition-all duration-300", step === 'signup' ? "max-w-full lg:max-w-lg" : "max-w-full lg:max-w-md mt-6 sm:mt-0")}>
            <AuthHeader step={step} securityQuestion={securityQuestion} type="desktop" />

            <div className="bg-white rounded-3xl sm:rounded-card shadow-card p-6 sm:p-8 lg:p-10 relative z-10 w-full mb-8 sm:mb-0 mt-4 sm:mt-0">
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
