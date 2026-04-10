// Main application logic for authentication flow
class AuthApp {
    constructor() {
        this.currentStep = 1;
        this.userEmail = '';
        this.companyId = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showStep(1);
        
        // Check if user is already logged in
        if (authAPI.isAuthenticated()) {
            this.redirectBasedOnRole();
        }
    }

    bindEvents() {
        // DOM Elements
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.step3 = document.getElementById('step3');
        this.step4 = document.getElementById('step4');
        this.messageDiv = document.getElementById('message');
        this.loadingDiv = document.getElementById('loading');
        this.steps = document.querySelectorAll('.step');
        this.stepLines = document.querySelectorAll('.step-line');
        
        // Buttons
        this.checkEmailBtn = document.getElementById('checkEmailBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.registerEmployeeBtn = document.getElementById('registerEmployeeBtn');
        this.resendOtpBtn = document.getElementById('resendOtpBtn');
        this.backToEmailBtn = document.getElementById('backToEmailBtn');
        this.backToEmailFromRegisterBtn = document.getElementById('backToEmailFromRegisterBtn');
        this.backToEmailFromEmployeeBtn = document.getElementById('backToEmailFromEmployeeBtn');
        
        // Inputs
        this.emailInput = document.getElementById('email');
        this.loginPasswordInput = document.getElementById('loginPassword');
        this.companyNameInput = document.getElementById('companyName');
        this.domainInput = document.getElementById('domain');
        this.registerPasswordInput = document.getElementById('registerPassword');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.otpCodeInput = document.getElementById('otpCode');
        this.employeePasswordInput = document.getElementById('employeePassword');
        this.employeeConfirmPasswordInput = document.getElementById('employeeConfirmPassword');

        // Event Listeners
        this.checkEmailBtn.addEventListener('click', () => this.handleEmailCheck());
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.registerBtn.addEventListener('click', () => this.handleRegister());
        this.registerEmployeeBtn.addEventListener('click', () => this.handleEmployeeRegister());
        this.resendOtpBtn.addEventListener('click', () => this.handleResendOTP());
        this.backToEmailBtn.addEventListener('click', () => this.showStep(1));
        this.backToEmailFromRegisterBtn.addEventListener('click', () => this.showStep(1));
        this.backToEmailFromEmployeeBtn.addEventListener('click', () => this.showStep(1));

        // Enter key support
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleEmailCheck();
        });

        this.loginPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        this.otpCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleEmployeeRegister();
        });

        // Auto-fill domain based on email
        this.emailInput.addEventListener('blur', () => {
            const email = this.emailInput.value.trim();
            if (email && this.domainInput.value === '') {
                const domain = email.split('@')[1];
                if (domain) {
                    this.domainInput.value = domain;
                }
            }
        });

        // Auto-tab for OTP input
        this.otpCodeInput.addEventListener('input', (e) => {
            if (e.target.value.length === 6) {
                this.employeePasswordInput.focus();
            }
        });
    }

    showMessage(text, type) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        setTimeout(() => {
            this.messageDiv.style.display = 'none';
        }, 5000);
    }

    showLoading(show) {
        this.loadingDiv.style.display = show ? 'block' : 'none';
    }

    updateStepIndicator(step) {
        this.steps.forEach((s, index) => {
            if (index < step) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
        
        this.stepLines.forEach((line, index) => {
            if (index < step - 1) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
    }

    showStep(stepNumber) {
        this.step1.classList.remove('active');
        this.step2.classList.remove('active');
        this.step3.classList.remove('active');
        this.step4.classList.remove('active');
        
        this.currentStep = stepNumber;
        
        if (stepNumber === 1) {
            this.step1.classList.add('active');
            this.updateStepIndicator(1);
        } else if (stepNumber === 2) {
            this.step2.classList.add('active');
            this.updateStepIndicator(2);
        } else if (stepNumber === 3) {
            this.step3.classList.add('active');
            this.updateStepIndicator(3);
        } else if (stepNumber === 4) {
            this.step4.classList.add('active');
            this.updateStepIndicator(3); // Employee registration is step 3 in flow
        }
    }

    async handleEmailCheck() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showMessage('Please enter your email address.', 'error');
            return;
        }
        
        if (!authAPI.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }

        this.userEmail = email;
        
        try {
            this.showLoading(true);
            const result = await authAPI.checkEmail(email);
            this.showLoading(false);
            
            console.log('Email check result:', result); // Debug log
            
            // Handle different scenarios based on the response data
            if (result.data.exists) {
                if (result.data.Event === "Employee Registration Required") {
                    // Employee needs to register with OTP
                    this.companyId = result.data.user.companyId;
                    this.showStep(4);
                    this.otpCodeInput.focus();
                    this.showMessage('Please check your email for OTP to complete employee registration.', 'success');
                } else {
                    // Regular user exists - show login
                    this.showStep(2);
                    this.loginPasswordInput.focus();
                }
            } else {
                // Email doesn't exist - show company registration
                this.showStep(3);
                this.companyNameInput.focus();
            }
            
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error checking email. Please try again.', 'error');
            console.error('Email check error:', error);
        }
    }


    async handleLogin() {
        const password = this.loginPasswordInput.value;
        
        if (!password) {
            this.showMessage('Please enter your password.', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const result = await authAPI.login(this.userEmail, password);
            this.showLoading(false);
            
            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                
                // Extract and store employee ID if available
                if (result.data.employee && result.data.employee.employeeId) {
                    console.log('Employee ID found in login response:', result.data.employee.employeeId);
                    localStorage.setItem('currentEmployeeId', result.data.employee.employeeId);
                    localStorage.setItem('employeeData', JSON.stringify(result.data.employee));
                } else if (result.data.employeeId) {
                    // Alternative: check if employeeId is at root level
                    console.log('Employee ID at root level:', result.data.employeeId);
                    localStorage.setItem('currentEmployeeId', result.data.employeeId);
                }
                
                // Determine and store role based on response
                let userRole = 'EMPLOYEE'; // Default role
                
                // Check if response has roles field (for admin)
                if (result.data.roles) {
                    userRole = result.data.roles;
                } 
                // Check role from token
                else if (result.data.user?.role) {
                    userRole = result.data.user.role;
                }
                // Check if user email contains admin pattern
                else if (this.userEmail.includes('admin') || this.userEmail.includes('Admin')) {
                    userRole = 'COMPANY_ADMIN';
                }
                
                localStorage.setItem('userRole', userRole);
                
                // Store company ID
                if (result.data.user?.companyId) {
                    localStorage.setItem('companyId', result.data.user.companyId);
                }
                
                console.log('Login successful, stored data:', {
                    token: result.data.token.substring(0, 20) + '...',
                    userId: result.data.user?.userId,
                    employeeId: localStorage.getItem('currentEmployeeId'),
                    role: userRole,
                    companyId: localStorage.getItem('companyId')
                });
                
                setTimeout(() => {
                    this.redirectBasedOnRole();
                }, 1500);
            } else {
                this.showMessage(result.data.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error during login. Please try again.', 'error');
        }
    }
    async handleRegister() {
        const companyName = this.companyNameInput.value.trim();
        const domain = this.domainInput.value.trim();
        const password = this.registerPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        if (!companyName) {
            this.showMessage('Please enter your company name.', 'error');
            return;
        }
        
        if (!domain) {
            this.showMessage('Please enter your company domain.', 'error');
            return;
        }
        
        if (!password) {
            this.showMessage('Please enter a password.', 'error');
            return;
        }
        
        if (!authAPI.isValidPassword(password)) {
            this.showMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const result = await authAPI.register(companyName, domain, this.userEmail, password);
            this.showLoading(false);
            
            if (result.success) {
                this.showMessage('Registration successful! Redirecting...', 'success');
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                
                // Store employee ID if available
                if (result.data.employee && result.data.employee.employeeId) {
                    localStorage.setItem('currentEmployeeId', result.data.employee.employeeId);
                }
                
                // Company registration is always admin
                localStorage.setItem('userRole', 'COMPANY_ADMIN');
                
                // Store company ID
                if (result.data.user?.companyId) {
                    localStorage.setItem('companyId', result.data.user.companyId);
                }
                
                setTimeout(() => {
                    this.redirectBasedOnRole();
                }, 1500);
            } else {
                this.showMessage(result.data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error during registration. Please try again.', 'error');
        }
    }

    async handleEmployeeRegister() {
        const otpCode = this.otpCodeInput.value.trim();
        const password = this.employeePasswordInput.value;
        const confirmPassword = this.employeeConfirmPasswordInput.value;
        
        if (!otpCode) {
            this.showMessage('Please enter the OTP code.', 'error');
            return;
        }
        
        if (!authAPI.isValidOTP(otpCode)) {
            this.showMessage('Please enter a valid 6-digit OTP code.', 'error');
            return;
        }
        
        if (!password) {
            this.showMessage('Please enter a password.', 'error');
            return;
        }
        
        if (!authAPI.isValidPassword(password)) {
            this.showMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const result = await authAPI.registerEmployee(otpCode, this.userEmail, password);
            this.showLoading(false);
            
            if (result.success) {
                this.showMessage('Employee registration successful! Redirecting...', 'success');
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                
                // Store employee ID if available
                if (result.data.employee && result.data.employee.employeeId) {
                    localStorage.setItem('currentEmployeeId', result.data.employee.employeeId);
                }
                
                // Employee registration is usually regular user
                localStorage.setItem('userRole', result.data.roles || 'EMPLOYEE');
                
                // Store company ID
                if (result.data.user?.companyId) {
                    localStorage.setItem('companyId', result.data.user.companyId);
                }
                
                setTimeout(() => {
                    this.redirectBasedOnRole();
                }, 1500);
            } else {
                this.showMessage(result.data.message || 'Employee registration failed. Please check the OTP and try again.', 'error');
            }
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error during employee registration. Please try again.', 'error');
        }
    }
    
    async handleResendOTP() {
        // For now, we'll just show a message since the backend might automatically resend OTP
        // In a real implementation, you might call a separate endpoint to resend OTP
        this.showMessage('If you didn\'t receive the OTP, please check your spam folder or try again in a few minutes.', 'success');
        
        // Optional: Implement actual resend OTP API call if available
        /*
        try {
            this.showLoading(true);
            const result = await authAPI.resendOTP(this.userEmail);
            this.showLoading(false);
            this.showMessage('OTP has been resent to your email.', 'success');
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error resending OTP. Please try again.', 'error');
        }
        */
    }
    redirectBasedOnRole() {
        const role = authAPI.getUserRole();
        
        console.log('Redirecting based on role:', role); // Debug log
        
        if (role === 'COMPANY_ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthApp();
});