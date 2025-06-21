// File: src/pages/auth/SignUpPage.jsx
import React, { useState } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { UserPlus, Eye, EyeOff, Gift } from 'lucide-react';

const SignUpPage = () => {
    const [step, setStep] = useState('signup'); // 'signup' or 'confirm'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        birthday: ''
    });
    const [confirmationCode, setConfirmationCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await signUp({
                username: formData.email,
                password: formData.password,
                attributes: {
                    email: formData.email,
                    given_name: formData.firstName,
                    family_name: formData.lastName || '',
                    phone_number: formData.phoneNumber || '',
                    birthdate: formData.birthday || ''
                }
            });

            setStep('confirm');
        } catch (error) {
            console.error('Sign up error:', error);

            let errorMessage = 'Failed to create account';
            if (error.name === 'UsernameExistsException') {
                errorMessage = 'An account with this email already exists';
            } else if (error.name === 'InvalidPasswordException') {
                errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await confirmSignUp({
                username: formData.email,
                confirmationCode: confirmationCode
            });

            // Redirect to sign in with success message
            navigate('/auth/signin?message=Account created successfully! Please sign in to start earning rewards.');
        } catch (error) {
            console.error('Confirmation error:', error);

            let errorMessage = 'Failed to confirm account';
            if (error.name === 'CodeMismatchException') {
                errorMessage = 'Invalid confirmation code';
            } else if (error.name === 'ExpiredCodeException') {
                errorMessage = 'Confirmation code has expired';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (step === 'confirm') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-500 p-3 rounded-full">
                                <Gift className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Check your email
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            We sent a confirmation code to <strong>{formData.email}</strong>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleConfirmSignUp}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmation Code
                            </label>
                            <Input
                                id="confirmationCode"
                                name="confirmationCode"
                                type="text"
                                required
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                className="w-full text-center text-lg tracking-widest"
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Confirming...
                                </div>
                            ) : (
                                'Confirm Account & Start Earning Rewards'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-primary p-3 rounded-full">
                            <UserPlus className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Join our rewards program
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Create an account and start earning points with every order!
                    </p>
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center">
                            <Gift className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">
                                Get 100 bonus points just for signing up!
                            </span>
                        </div>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address *
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pr-10"
                                    placeholder="8+ characters"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Must contain uppercase, lowercase, and numbers
                            </p>
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div>
                            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                                Birthday
                            </label>
                            <Input
                                id="birthday"
                                name="birthday"
                                type="date"
                                value={formData.birthday}
                                onChange={handleInputChange}
                                className="w-full"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Optional: Get special birthday rewards!
                            </p>
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create Account & Get 100 Points'
                            )}
                        </Button>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/auth/signin"
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;