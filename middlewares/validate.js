const user = require("../models/user");

exports.validateSignUp = async (req, res, next) => {
    const signUpData = req.body;

    const validationRules = {
        username: [
            {function: 'isRequired'},
            {function: 'noSpaces'},
            {function: 'checkLength', args: [2,30]},
            {function: 'isUsername'},
        ],
        email: [
            {function: 'isRequired'},
            {function: 'noSpaces'},
            {function: 'isEmail'},
        ],
        password: [
            {function: 'isRequired'},
            {function: 'noSpaces'},
            {function: 'checkLength', args: [6,30]},
            {function: 'isPassword'},
        ],
        confirmPassword: [
            {function: 'isRequired'},
            {function: 'isSameAsPassword', args: [signUpData.password]},
        ],
    }

    const signUpValidation = {
        username: {
            errorMessage: '',
            isValid: false,
            isUnique: false,
        },
        email: {
            errorMessage: '',
            isValid: false,
            isUnique: false,
        },
        password: {
            errorMessage: '',
            isValid: false,
        },
        confirmPassword: {
            errorMessage: '',
            isValid: false,
        },
    }
        
    for(const [key, validations] of Object.entries(validationRules)){
        for(const [index, validation] of Object.entries(validations)){
            const message = validationFunctions[validation.function](
                signUpData[key],
                ...(validation.args || [])
            )

            if(message){
                signUpValidation[key].errorMessage = message;
                signUpValidation[key].isValid = false;
                break;
            } else {
                if(+index === validations.length - 1){
                    signUpValidation[key].isValid = true;
                }
                signUpValidation[key].errorMessage = message;
            }
        }
    }

    const userByUsername = await user.findOne({username: signUpData.username});
    const userByEmail = await user.findOne({email: signUpData.email});

    if(!userByUsername) {
        signUpValidation.username.isUnique = true;
    }

    if(!userByEmail) {
        signUpValidation.email.isUnique = true;
    }

    if(
        signUpValidation.username.isValid &&
        signUpValidation.username.isUnique &&
        signUpValidation.email.isValid &&
        signUpValidation.email.isUnique &&
        signUpValidation.password.isValid &&
        signUpValidation.confirmPassword.isValid
    ) {
        next();
    } else {
        res.json({
            success: false,
            validation: signUpValidation,
            values: signUpData,
        })
    }
}

exports.validateSignIn = (req, res, next) => {
    const signInData = req.body;

    const validationRules = {
        usernameOrEmail: [
            {function: 'isRequired'},
        ],
        password: [
            {function: 'isRequired'},
        ],
    };

    const signInValidation = {
        usernameOrEmail: {
            errorMessage: '',
            isValid: false,
        },
        password: {
            errorMessage: '',
            isValid: false,
        },
    }

    for(const [key, validations] of Object.entries(validationRules)){
        for(const [index, validation] of Object.entries(validations)){
            const message = validationFunctions[validation.function](
                signInData[key],
                ...(validation.args || [])
            )

            if(message){
                signInValidation[key].errorMessage = message;
                signInValidation[key].isValid = false;
                break;
            } else {
                if(+index === validations.length - 1){
                    signInValidation[key].isValid = true;
                }
                signInValidation[key].errorMessage = message;
            }
        }
    }

    if(
        signInValidation.usernameOrEmail.isValid &&
        signInValidation.password.isValid
    ) {
        next();
    } else {
        res.json({
            success: false,
            validation: signInValidation,
            values: signInData,
        })
    }
}

const validationFunctions = {
    isRequired: function(value){
        return !!value.trim() ? '' : 'This field is required';
    },
    checkLength: function(value, min, max){
        return value.trim().length >= min && value.trim().length <= max ? '' : `Input must be minimum ${min} and maximum ${max} characters in length`;
    },
    noSpaces: function(value){
        return !value.includes(' ') ? '' : `Input must not contain spaces`;
    },
    isUsername: function(value){
        return /^[a-zA-Z0-9_.]+$/.test(value) ? '' : `Only alphanumeric characters {A-Z, a-z, 0-9}, underscore {_}, and period {.} are allowed`
    },
    isEmail: function (value) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ? '' : 'Enter a valid email address';
    },
    isPassword: function(value){
        let hasNumeric = false;
        let hasUppercase = false;
        let hasLowercase = false;
        let hasSpecial = false;
        let hasInvalidChar = false;
        const invalidChars = [];
        const numericCharacters = [48, 57]; // 0-9
        const uppercaseCharacters = [65, 90]; // A-Z
        const lowercaseCharacters = [97, 122]; // a-z
        const specialCharacters = [
            [33, 33], // !
            [35, 36], // #$
            [38, 38], // &
            [40, 43], // ()*+
            [45, 46], // _.
            [61, 61], // =
            [63, 64], // ?@
            [91, 91], // [
            [93, 96], // ]^_`
            [126, 126], // ~
        ]
        

        value.split('').forEach((char) => {
            let isNumeric = false;
            let isUppercase = false;
            let isLowercase = false;
            let isSpecial = false;
            const charCode = char.charCodeAt(0);

            if(charCode >= numericCharacters[0] && charCode <= numericCharacters[1]){
                hasNumeric = true;
                isNumeric = true;
            }

            if(charCode >= uppercaseCharacters[0] && charCode <= uppercaseCharacters[1]){
                hasUppercase = true;
                isUppercase = true;
            }

            if(charCode >= lowercaseCharacters[0] && charCode <= lowercaseCharacters[1]){
                hasLowercase = true;
                isLowercase = true;
            }

            specialCharacters.forEach((chars, i) => {
                if(charCode >= chars[0] && charCode <= chars[1]){
                    hasSpecial = true;
                    isSpecial = true;
                }
            })

            if(!isNumeric && !isUppercase && !isLowercase && !isSpecial) {
                hasInvalidChar = true;
                invalidChars.push(char);
            }
        })

        if(hasInvalidChar) {
            return `Password has invalid character${invalidChars.length ? 's' : ''}: ${invalidChars.join(' ')}`; 
        }

        if(!hasNumeric || !hasUppercase || !hasLowercase || !hasSpecial) {
            return 'Password must contain at least one uppercase letter {A-Z}, at least one lowercase letter {a-z}, at least one digit {0-9}, and at least one special character from !#$&()*+_.=?@[]^_`~'
        }

        return '';
    },
    isSameAsPassword: function(value, password){
        return value === password ? '' : 'Passwords do not match';
    }
}