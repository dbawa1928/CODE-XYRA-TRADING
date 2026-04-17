export async function registerBiometric(username) {
  if (!window.PublicKeyCredential) return { success: false, error: 'WebAuthn not supported' }
  try {
    const publicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32),
      rp: { name: 'CodeXyra Trading', id: window.location.hostname },
      user: { id: new TextEncoder().encode(username), name: username, displayName: username },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    }
    const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions })
    // In production, send credential to server for storage
    localStorage.setItem('biometric_credential', JSON.stringify(credential))
    localStorage.setItem('biometric_username', username)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function loginWithBiometric() {
  if (!window.PublicKeyCredential) return { success: false, error: 'Not supported' }
  const stored = localStorage.getItem('biometric_credential')
  if (!stored) return { success: false, error: 'No biometric registered' }
  try {
    const credential = await navigator.credentials.get({ publicKey: { challenge: new Uint8Array(32) } })
    // Validate credential with server
    return { success: true, username: localStorage.getItem('biometric_username') }
  } catch (err) {
    return { success: false, error: err.message }
  }
}