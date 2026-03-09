'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.email) {
          router.push('/dashboard');
        }
      } catch (error) {
        // Invalid user data, continue to login
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Authenticate user with database
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('User logged in successfully:', data.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-page h-screen w-full bg-white flex items-center justify-center p-4 overflow-hidden">
      {/* Enhanced Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md z-10">

        {/* Enhanced Login Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-6 transform hover:scale-[1.01] transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Ittefaq Builders Iron and Cement Store</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Email Field */}
              <TextField
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                fullWidth
                variant="outlined"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                fullWidth
                variant="outlined"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Error Message */}
              {error && (
                <Alert severity="error" className="animate-shake">
                  {error}
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                size="large"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </form>
        </div>


        {/* Enhanced Footer */}
        <div className="text-center mt-4 text-gray-500 text-sm">
          <p className="font-medium">&copy; 2026 Design and Developed by RapidTechPro and All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
