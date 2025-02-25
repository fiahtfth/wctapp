'use server';
export async function login(credentials: { email: string; password: string }) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const { token } = await response.json();
    localStorage.setItem('token', token);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}
export async function logout() {
  // Implement logout logic
  try {
    // Placeholder for logout
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed' };
  }
}
