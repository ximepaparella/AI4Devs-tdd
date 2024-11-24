import { Candidate } from '../domain/models/Candidate';
import { validateCandidateData } from '../application/validator';
import { PrismaClient } from '@prisma/client';

// Create a custom error class for testing
class PrismaError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
        super(message);
        this.name = 'PrismaError';
        this.code = code;
    }
}

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        candidate: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient)
    };
});

describe('Candidate Model Tests', () => {
    let prismaClient: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        prismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
    });

    describe('Candidate Creation', () => {
        it('should create a valid candidate successfully', async () => {
            // Arrange
            const validCandidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '666777888',
                address: 'Test Address',
                education: [],
                workExperience: [],
                resumes: []
            };

            const candidate = new Candidate(validCandidateData);
            prismaClient.candidate.create.mockResolvedValue({ id: 1, ...validCandidateData });

            // Act
            const result = await candidate.save();

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
        });

        it('should throw error for invalid email format', () => {
            // Arrange
            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                education: [],
                workExperience: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidData)).toThrow('Invalid email');
        });

        it('should throw error for invalid phone format', () => {
            // Arrange
            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '123', // Invalid phone
                education: [],
                workExperience: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidData)).toThrow('Invalid phone');
        });

        it('should handle database connection errors', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                education: [],
                workExperience: [],
                resumes: []
            };

            const candidate = new Candidate(candidateData);
            const dbError = new PrismaError('Database connection error');
            dbError.name = 'PrismaClientInitializationError';
            prismaClient.candidate.create.mockRejectedValue(dbError);

            // Act & Assert
            await expect(candidate.save()).rejects.toThrow('No se pudo conectar con la base de datos');
        });
    });

    describe('Education Validation', () => {
        it('should validate education data correctly', () => {
            // Arrange
            const candidateWithEducation = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }],
                workExperience: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(candidateWithEducation)).not.toThrow();
        });

        it('should throw error for invalid education dates', () => {
            // Arrange
            const invalidEducationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: 'invalid-date',
                    endDate: '2024-01-01'
                }],
                workExperience: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidEducationData)).toThrow('Invalid date');
        });
    });

    describe('Work Experience Validation', () => {
        it('should validate work experience data correctly', () => {
            // Arrange
            const candidateWithExperience = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    description: 'Full stack development',
                    startDate: '2020-01-01',
                    endDate: '2023-01-01'
                }],
                education: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(candidateWithExperience)).not.toThrow();
        });

        it('should throw error for invalid work experience description length', () => {
            // Arrange
            const invalidExperienceData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    description: 'a'.repeat(201), // Exceeds 200 character limit
                    startDate: '2020-01-01',
                    endDate: '2023-01-01'
                }],
                education: [],
                resumes: []
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidExperienceData)).toThrow('Invalid description');
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                education: [],
                workExperience: [],
                resumes: []
            };

            const candidate = new Candidate(candidateData);
            const dbError = new PrismaError('Database connection error');
            dbError.name = 'PrismaClientInitializationError';
            prismaClient.candidate.create.mockRejectedValue(dbError);

            // Act & Assert
            await expect(candidate.save()).rejects.toThrow('No se pudo conectar con la base de datos');
        });

        it('should handle record not found errors', async () => {
            // Arrange
            const candidateData = {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                education: [],
                workExperience: [],
                resumes: []
            };

            const candidate = new Candidate(candidateData);
            const notFoundError = new PrismaError('Record not found', 'P2025');
            prismaClient.candidate.update.mockRejectedValue(notFoundError);

            // Act & Assert
            await expect(candidate.save()).rejects.toThrow('No se pudo encontrar el registro');
        });
    });

    describe('Data Validation Edge Cases', () => {
        it('should accept names with special characters and accents', () => {
            const validData = {
                firstName: 'José María',
                lastName: 'García-Pérez',
                email: 'jose@example.com',
                education: [],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(validData)).not.toThrow();
        });

        it('should accept valid complex email formats', () => {
            const validEmails = [
                'user+label@domain.co.uk',
                'valid.email-with-dash@domain.com',
                'very.common@example.com',
                'disposable.style.email.with+symbol@example.com'
            ];

            validEmails.forEach(email => {
                const validData = {
                    firstName: 'John',
                    lastName: 'Doe',
                    email,
                    education: [],
                    workExperience: [],
                    resumes: []
                };
                expect(() => validateCandidateData(validData)).not.toThrow();
            });
        });

        it('should handle maximum length boundary cases', () => {
            const maxLengthData = {
                firstName: 'a'.repeat(100),
                lastName: 'a'.repeat(100),
                email: `${'a'.repeat(50)}@example.com`,
                address: 'a'.repeat(100),
                education: [],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(maxLengthData)).not.toThrow();
        });

        it('should reject names with numbers', () => {
            const invalidData = {
                firstName: 'John123',
                lastName: 'Doe',
                email: 'john@example.com',
                education: [],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(invalidData)).toThrow('Invalid name');
        });
    });

    describe('Education Records Edge Cases', () => {
        it('should reject education end date before start date', () => {
            const invalidEducationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: '2024-01-01',
                    endDate: '2020-01-01'
                }],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(invalidEducationData)).toThrow('Invalid end date');
        });

        it('should accept education without end date (currently studying)', () => {
            const currentEducationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: '2020-01-01'
                }],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(currentEducationData)).not.toThrow();
        });

        it('should handle multiple education records', () => {
            const multipleEducationData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                educations: [
                    {
                        institution: 'High School',
                        title: 'High School Diploma',
                        startDate: '2015-01-01',
                        endDate: '2018-12-31'
                    },
                    {
                        institution: 'University',
                        title: 'Bachelor Degree',
                        startDate: '2019-01-01',
                        endDate: '2023-12-31'
                    }
                ],
                workExperience: [],
                resumes: []
            };

            expect(() => validateCandidateData(multipleEducationData)).not.toThrow();
        });
    });

    describe('Resume Related Edge Cases', () => {
        it('should validate multiple resumes for same candidate', async () => {
            const candidateWithMultipleResumes = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                resumes: [
                    {
                        filePath: '/path/to/resume1.pdf',
                        fileType: 'application/pdf'
                    },
                    {
                        filePath: '/path/to/resume2.docx',
                        fileType: 'application/msword'
                    }
                ],
                education: [],
                workExperience: []
            };

            const candidate = new Candidate(candidateWithMultipleResumes);
            prismaClient.candidate.create.mockResolvedValue({ id: 1, ...candidateWithMultipleResumes });

            const result = await candidate.save();
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
        });

        it('should reject invalid file types', () => {
            const invalidResumeData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                resumes: [
                    {
                        filePath: '/path/to/resume.exe',
                        fileType: 'application/x-msdownload'
                    }
                ],
                education: [],
                workExperience: []
            };

            expect(() => validateCandidateData(invalidResumeData)).toThrow('Invalid CV data');
        });

        it('should handle very long file paths', () => {
            const longPathData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                resumes: [
                    {
                        filePath: '/very/long/path/'.repeat(100) + 'resume.pdf',
                        fileType: 'application/pdf'
                    }
                ],
                education: [],
                workExperience: []
            };

            expect(() => validateCandidateData(longPathData)).toThrow('Invalid CV data');
        });
    });
}); 