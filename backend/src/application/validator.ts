const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\-\s]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(6|7|9)\d{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_PATH_LENGTH = 255;

//Length validations according to the database schema

const validateName = (name: string) => {
    if (!name || name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
        throw new Error('Invalid name');
    }
};

const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email');
    }
};

const validatePhone = (phone: string) => {
    if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error('Invalid phone');
    }
};

const validateDate = (date: string) => {
    if (!date || !DATE_REGEX.test(date)) {
        throw new Error('Invalid date');
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
    }
};

const validateEducationDates = (startDate: string, endDate?: string) => {
    validateDate(startDate);
    
    if (endDate) {
        validateDate(endDate);
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            throw new Error('Invalid end date: End date cannot be before start date');
        }
    }
};

const validateAddress = (address: string) => {
    if (address && address.length > 100) {
        throw new Error('Invalid address');
    }
};

const validateEducation = (education: any) => {
    if (!education.institution || education.institution.length > 100) {
        throw new Error('Invalid institution');
    }

    if (!education.title || education.title.length > 100) {
        throw new Error('Invalid title');
    }

    validateEducationDates(education.startDate, education.endDate);
};

const validateExperience = (experience: any) => {
    if (!experience.company || experience.company.length > 100) {
        throw new Error('Invalid company');
    }

    if (!experience.position || experience.position.length > 100) {
        throw new Error('Invalid position');
    }

    if (experience.description && experience.description.length > 200) {
        throw new Error('Invalid description');
    }

    validateDate(experience.startDate);

    if (experience.endDate && !DATE_REGEX.test(experience.endDate)) {
        throw new Error('Invalid end date');
    }
};

const validateCV = (cv: any) => {
    if (!cv || typeof cv !== 'object') {
        throw new Error('Invalid CV data');
    }

    if (!cv.filePath || typeof cv.filePath !== 'string') {
        throw new Error('Invalid CV data');
    }

    if (cv.filePath.length > MAX_FILE_PATH_LENGTH) {
        throw new Error('Invalid CV data');
    }

    if (!cv.fileType || !ALLOWED_FILE_TYPES.includes(cv.fileType)) {
        throw new Error('Invalid CV data');
    }
};

export const validateCandidateData = (data: any) => {
    if (data.id) {
        // If id is provided, we are editing an existing candidate
        // Validate only the fields that are present
        if (data.firstName) validateName(data.firstName);
        if (data.lastName) validateName(data.lastName);
        if (data.email) validateEmail(data.email);
        if (data.phone) validatePhone(data.phone);
        if (data.address) validateAddress(data.address);
    } else {
        // New candidate - validate required fields
        validateName(data.firstName);
        validateName(data.lastName);
        validateEmail(data.email);
        if (data.phone) validatePhone(data.phone);
        if (data.address) validateAddress(data.address);
    }

    // Validate education records if present
    if (data.educations && Array.isArray(data.educations)) {
        data.educations.forEach((education: any) => {
            validateEducation(education);
        });
    }

    // Validate work experiences if present
    if (data.workExperiences && Array.isArray(data.workExperiences)) {
        data.workExperiences.forEach((experience: any) => {
            validateExperience(experience);
        });
    }

    // Validate resumes if present
    if (data.resumes && Array.isArray(data.resumes)) {
        if (data.resumes.length > 5) { // Maximum 5 resumes per candidate
            throw new Error('Too many resumes');
        }
        data.resumes.forEach((resume: any) => {
            validateCV(resume);
        });
    }
};