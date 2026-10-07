// Contact enquiry submission.
//
// There is no backend yet, so submitEnquiry() only validates and resolves
// locally — nothing is sent anywhere. When the Django API is ready, set
// ENQUIRY_ENDPOINT (e.g. '/api/enquiries/') and the fetch below takes over.
// Expected request body: { name, phone, email, message } as JSON.
export const ENQUIRY_ENDPOINT = null

export async function submitEnquiry(payload) {
  if (!ENQUIRY_ENDPOINT) {
    return { delivered: false }
  }

  const response = await fetch(ENQUIRY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Enquiry failed with status ${response.status}`)
  return { delivered: true }
}

export function validateEnquiry({ name, phone, email, message }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Please enter your name.'
  const digits = phone.replace(/\D/g, '')
  if (!digits) errors.phone = 'Please enter your phone number.'
  else if (digits.length < 10 || digits.length > 13) errors.phone = 'Please enter a valid phone number.'
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!message.trim()) errors.message = 'Please tell us what you need.'
  return errors
}
