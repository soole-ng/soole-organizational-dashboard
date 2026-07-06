import { useNavigate } from 'react-router-dom'
import { Building2, UserPlus, ArrowRight } from 'lucide-react'

export function SignupChoicePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-primary-75 flex flex-col lg:flex-row items-center justify-center p-6">
      <div className="w-full max-w-[600px]">
        <div className="text-center mb-12">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-secondary-500 rounded-2xl shadow-sm">
            <img src="/soole-icon.png" alt="Soole" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-primary-500 mb-3 font-display">
            Get Started with Soole
          </h1>
          <p className="text-neutral-300 text-base">
            Choose how you'd like to sign up
          </p>
        </div>

        <div className="space-y-4">
          {/* New Organization Option */}
          <button
            onClick={() => navigate('/login', { state: { showSignup: true } })}
            className="w-full bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all text-left group border border-neutral-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary-75 flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0 mt-1">
                  <Building2 className="w-6 h-6 text-primary-500" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black mb-1">
                    Start a New Organization
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Register your organization. Complete quick signup, then verify your details to unlock full access.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Join Team Option */}
          <button
            onClick={() => navigate('/join')}
            className="w-full bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-all text-left group border border-neutral-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-secondary-75 flex items-center justify-center group-hover:bg-secondary-100 transition-colors flex-shrink-0 mt-1">
                  <UserPlus className="w-6 h-6 text-secondary-500" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black mb-1">
                    Join as Team Member
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    You've been invited to an organization. Use your invite PIN to join the team and start working.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-100">
          <p className="text-center text-sm text-neutral-300">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-teal-300 font-black hover:text-teal-200 transition-colors underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
