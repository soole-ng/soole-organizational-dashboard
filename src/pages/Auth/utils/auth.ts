import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().length(10, 'Phone must be exactly 10 digits'),
  password: z.string().min(1, 'Password is required')
})

export const signupSchema = z.object({
  suOrgName: z.string().min(2, 'Company name is required'),
  suOwnerFirstName: z.string().min(2, 'First name is required'),
  suOwnerLastName: z.string().min(2, 'Last name is required'),
  suPhone: z.string().length(10, 'Phone must be exactly 10 digits'),
})

export const passwordSchema = z.object({
  suPassword: z.string()
    .min(8, 'Password must be exactly 8 characters')
    .max(8, 'Password must be exactly 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character (!@#$%^&*)'),
  suConfirmPassword: z.string(),
}).refine(data => data.suPassword === data.suConfirmPassword, {
  message: 'Passwords do not match',
  path: ['suConfirmPassword'],
})

export const forgotPasswordPhoneSchema = z.object({
  phone: z.string().length(10, 'Phone must be exactly 10 digits')
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[!@#$%^&*]/, 'Password must contain a special character (!@#$%^&*)'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type Step =
  | 'login'
  | 'otp'
  | 'security_question'
  | 'signup'
  | 'signup_otp'
  | 'signup_password'
  | 'security_setup'
  | 'forgot_password'
  | 'forgot_password_otp'
  | 'forgot_password_reset'

export const COUNTRY_CODES = [
  { code: '+234', flag: 'https://flagcdn.com/w40/ng.png', name: 'Nigeria' },
  { code: '+233', flag: 'https://flagcdn.com/w40/gh.png', name: 'Ghana' },
  { code: '+254', flag: 'https://flagcdn.com/w40/ke.png', name: 'Kenya' },
  { code: '+27', flag: 'https://flagcdn.com/w40/za.png', name: 'South Africa' },
  { code: '+250', flag: 'https://flagcdn.com/w40/rw.png', name: 'Rwanda' },
  { code: '+256', flag: 'https://flagcdn.com/w40/ug.png', name: 'Uganda' },
  { code: '+237', flag: 'https://flagcdn.com/w40/cm.png', name: 'Cameroon' },
]

/** Backend requires latitude/longitude on every login step; falls back to 0,0 if denied. */
export function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: 0, longitude: 0 }),
      { timeout: 5000 }
    )
  })
}
