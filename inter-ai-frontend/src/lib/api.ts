const formatBaseUrl = (url: string | undefined): string => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
        trimmed = `https://${trimmed}`;
    }
    return trimmed.replace(/\/+$/, '');
};

export const API_BASE_URL = formatBaseUrl(import.meta.env.VITE_API_URL);

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

export interface UserUsage {
    tokens_used: number;
    sessions_this_month: number;
    monthly_token_limit: number;
    monthly_session_limit: number;
}

export const getUserUsage = async (): Promise<UserUsage> => {
    const response = await fetch(getApiUrl('/api/user/usage'), {
        headers: { ...getAuthHeaders() }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to load usage');
    }

    return response.json();
};

// --- AI Usage (token-based rate limiting & quotas) ---

export interface AiUsageMeter {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string;
}

export interface AiUsage {
    requests: AiUsageMeter;
    hourly: {
        input_tokens: AiUsageMeter;
        output_tokens: AiUsageMeter;
    };
    daily: {
        tokens: AiUsageMeter;
    };
}

export interface AiRateLimitInfo {
    error: string;
    message: string;
    limit_type: string;
    limit: number;
    used: number;
    remaining: number;
    retry_after: number;
}

export const getAiUsage = async (): Promise<AiUsage> => {
    const response = await fetch(getApiUrl('/api/usage'), {
        headers: { ...getAuthHeaders() }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to load AI usage');
    }

    return response.json();
};

export const getRateLimitInfo = (data: any): AiRateLimitInfo | null => {
    if (!data || typeof data !== 'object') return null;
    if (data.error !== 'rate_limit_exceeded' || !data.limit_type) return null;
    return {
        error: data.error,
        message: data.message || 'AI usage limit exceeded.',
        limit_type: data.limit_type,
        limit: Number(data.limit) || 0,
        used: Number(data.used) || 0,
        remaining: Number(data.remaining) || 0,
        retry_after: Number(data.retry_after) || 0,
    };
};
