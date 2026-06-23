export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (endpoint: string) => {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${path}`;
};

export const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    let token = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.access_token) {
                token = user.access_token;
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
        }
    }
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const registerUser = async (data: { name?: string; company?: string; email: string; password: string }) => {
    const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to register account');
    }
    
    return response.json();
};

export const deleteAccount = async () => {
    const response = await fetch(getApiUrl('/api/user/account'), {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to delete account');
    }
    
    return response.json();
};

export const verifyDeleteAccount = async (otp: string) => {
    const response = await fetch(getApiUrl('/api/user/account/verify'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ otp })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to verify OTP for account deletion');
    }
    
    return response.json();
};

export const updateName = async (name: string) => {
    const response = await fetch(getApiUrl('/api/user/name'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update name');
    }
    
    return response.json();
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch(getApiUrl('/api/user/password'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to update password');
    }
    
    return response.json();
};

export const verifyUpdatePassword = async (currentPassword: string, newPassword: string, otp: string) => {
    const response = await fetch(getApiUrl('/api/user/password/verify'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, otp })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to verify OTP for password update');
    }
    
    return response.json();
};

export const toggle2FA = async (enabled: boolean) => {
    const response = await fetch(getApiUrl('/api/user/2fa'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled })
    });
    
    if (!response.ok) {
        throw new Error('Failed to toggle 2FA settings');
    }
    
    return response.json();
};

export const requestForgotPassword = async (email: string) => {
    const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to request password reset');
    }
    
    return response.json();
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const response = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to reset password');
    }
    
    return response.json();
};
