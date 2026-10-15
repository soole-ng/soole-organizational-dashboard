import { Step } from '../utils/auth'

interface AuthHeaderProps {
  step: Step
  securityQuestion?: string
  type: 'mobile' | 'desktop'
}

export function AuthHeader({ step, securityQuestion, type }: AuthHeaderProps) {
  const getTitle = () => {
    if (type === 'mobile') {
      switch (step) {
        case 'login': return 'Welcome back'
        case 'signup': return 'Create Account'
        case 'security_setup': return 'Secure your account'
        case 'security_question': return 'Security Verification'
        case 'forgot_password':
        case 'forgot_password_otp':
        case 'forgot_password_reset': return 'Reset Password'
        default: return 'Verify your phone'
      }
    } else {
      switch (step) {
        case 'login': return 'Sign in'
        case 'signup': return 'Register Company'
        case 'security_setup': return 'Secure your account'
        case 'security_question': return 'Security Verification'
        case 'forgot_password':
        case 'forgot_password_otp':
        case 'forgot_password_reset': return 'Reset Password'
        default: return 'Verify your phone'
      }
    }
  }

  const getDescription = () => {
    if (type === 'mobile') {
      switch (step) {
        case 'login': return 'Sign in to your organization account'
        case 'signup': return 'Register your company on Soole'
        case 'security_setup': return 'Set up a security question for account recovery and withdrawals'
        case 'security_question': return 'Please answer your backup security question to continue'
        case 'forgot_password': return 'Enter your phone number to receive a reset code'
        case 'forgot_password_otp': return 'Enter the verification code sent to your phone'
        case 'forgot_password_reset': return 'Create a strong new password for your account'
        default: return 'Enter the verification code sent via SMS'
      }
    } else {
      switch (step) {
        case 'login': return 'Enter your phone number and password to continue'
        case 'signup': return 'Fill out your basic details to get started'
        case 'security_setup': return 'Set up a security question - used for account recovery and required before withdrawals'
        case 'security_question': return 'Please answer your backup security question to continue'
        case 'forgot_password': return 'Enter your phone number to receive a password reset code'
        case 'forgot_password_otp': return 'Enter the 5-digit verification code sent to your phone'
        case 'forgot_password_reset': return 'Create a strong new password for your account'
        default: return 'Enter the 5-digit verification code sent to your phone'
      }
    }
  }

  const title = getTitle()
  const description = getDescription()

  if (type === 'mobile') {
    return (
      <div className="bg-primary-500 px-6 pt-6 pb-5 text-white lg:hidden flex-shrink-0 flex flex-col items-center">
        <img src="/soole-icon.png" alt="Soole logo" className="w-12 h-auto object-contain z-10" />
        <h2 className="text-2xl font-extrabold text-white mb-3 -mt-1 font-display tracking-tight z-10">Soole</h2>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-1.5 font-display text-center text-balance">
          {title}
        </h1>
        <p className="text-primary-200 text-sm sm:text-base text-center">
          {description}
        </p>
      </div>
    )
  }

  return (
    <div className="hidden lg:block mb-8">
      <h1 className="text-4xl xl:text-5xl font-extrabold text-primary-500 mb-2 font-display">
        {title}
      </h1>
      <p className="text-neutral-300 text-base">
        {description}
      </p>
    </div>
  )
}
