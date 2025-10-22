import { describe, it, expect } from "@jest/globals";
import {
    ApiError,
    BadRequestError,
    ResourceNotFoundError,
    DuplicateResourceError,
    InvalidOperationError,
    BusinessRuleViolationError,
    ExternalServiceError,
    InternalServerError,
} from "@/error/apiError";

describe("ApiError", () => {
    describe("BadRequestError", () => {
        it("should create error with default values", () => {
            const error = new BadRequestError();

            expect(error.message).toBe("Bad Request");
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe("BAD_REQUEST");
            expect(error.name).toBe("BadRequestError");
        });

        it("should create error with custom values", () => {
            const error = new BadRequestError("Invalid input", "CUSTOM_ERROR", { field: "email" });

            expect(error.message).toBe("Invalid input");
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe("CUSTOM_ERROR");
            expect(error.details).toEqual({ field: "email" });
        });

        it("should create error with object format - details only", () => {
            const error = new BadRequestError({ details: { field: "email", reason: "invalid format" } });

            expect(error.message).toBe("Bad Request");
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe("BAD_REQUEST");
            expect(error.details).toEqual({ field: "email", reason: "invalid format" });
        });

        it("should create error with object format - all properties", () => {
            const error = new BadRequestError({
                message: "Custom message",
                errorCode: "CUSTOM_CODE",
                details: { test: true },
            });

            expect(error.message).toBe("Custom message");
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe("CUSTOM_CODE");
            expect(error.details).toEqual({ test: true });
        });
    });

    describe("ResourceNotFoundError", () => {
        it("should create error without identifier", () => {
            const error = new ResourceNotFoundError("User");

            expect(error.message).toBe("User not found");
            expect(error.statusCode).toBe(404);
            expect(error.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("should create error with identifier", () => {
            const error = new ResourceNotFoundError("User", 123);

            expect(error.message).toBe("User with identifier '123' not found");
            expect(error.statusCode).toBe(404);
            expect(error.errorCode).toBe("RESOURCE_NOT_FOUND");
        });
    });

    describe("DuplicateResourceError", () => {
        it("should create error with identifier", () => {
            const error = new DuplicateResourceError("User", "user@example.com");

            expect(error.message).toBe("User with identifier 'user@example.com' already exists");
            expect(error.statusCode).toBe(409);
            expect(error.errorCode).toBe("DUPLICATE_RESOURCE");
        });
    });

    describe("InvalidOperationError", () => {
        it("should create error with reason", () => {
            const error = new InvalidOperationError("User creation", "Age must be 18 or older");

            expect(error.message).toBe("Invalid operation 'User creation': Age must be 18 or older");
            expect(error.statusCode).toBe(422);
            expect(error.errorCode).toBe("INVALID_OPERATION");
        });
    });

    describe("BusinessRuleViolationError", () => {
        it("should create error with rule description", () => {
            const error = new BusinessRuleViolationError("Maximum 5 projects per user");

            expect(error.message).toBe("Business rule violation: Maximum 5 projects per user");
            expect(error.statusCode).toBe(422);
            expect(error.errorCode).toBe("BUSINESS_RULE_VIOLATION");
        });
    });

    describe("ExternalServiceError", () => {
        it("should create error with service name and original error", () => {
            const originalError = new Error("Connection timeout");
            const error = new ExternalServiceError("Payment Service", originalError);

            expect(error.message).toBe("External service 'Payment Service' error: Connection timeout");
            expect(error.statusCode).toBe(503);
            expect(error.errorCode).toBe("EXTERNAL_SERVICE_ERROR");
        });
    });

    describe("InternalServerError", () => {
        it("should create error with default values", () => {
            const error = new InternalServerError();

            expect(error.message).toBe("Internal Server Error");
            expect(error.statusCode).toBe(500);
            expect(error.errorCode).toBe("INTERNAL_SERVER_ERROR");
        });

        it("should create error with object format - details only", () => {
            const error = new InternalServerError({ details: { userId: 123, action: "updateProfile" } });

            expect(error.message).toBe("Internal Server Error");
            expect(error.statusCode).toBe(500);
            expect(error.errorCode).toBe("INTERNAL_SERVER_ERROR");
            expect(error.details).toEqual({ userId: 123, action: "updateProfile" });
        });

        it("should create error with object format - custom message and details", () => {
            const error = new InternalServerError({
                message: "Database connection failed",
                details: { connectionString: "***", timeout: 5000 },
            });

            expect(error.message).toBe("Database connection failed");
            expect(error.statusCode).toBe(500);
            expect(error.errorCode).toBe("INTERNAL_SERVER_ERROR");
            expect(error.details).toEqual({ connectionString: "***", timeout: 5000 });
        });
    });

    describe("toJSON", () => {
        it("should serialize error correctly", () => {
            const error = new BadRequestError("Invalid input", "CUSTOM_ERROR", { field: "email" });
            const json = error.toJSON();

            expect(json).toEqual({
                name: "BadRequestError",
                message: "Invalid input",
                statusCode: 400,
                errorCode: "CUSTOM_ERROR",
                details: { field: "email" },
            });
        });
    });

    describe("inheritance", () => {
        it("should be instance of Error", () => {
            const error = new BadRequestError();

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApiError);
        });

        it("should have proper stack trace", () => {
            const error = new BadRequestError();

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain("BadRequestError");
        });
    });
});
