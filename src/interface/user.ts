import { RoleInterface } from "./roles";

export interface UserInterface {
    _id: string;
    id: string;
    email: string;
    role: RoleInterface[];
    refreshToken: string | null,
    passwordHash: string,
    registrationType: string[] | [],
    isVerified: boolean,
    fullName: string | null,
    country: string | null,
    countryCode: string | null,
    phoneNumber: string | null,
    isPublisherFormSubmitted: boolean,

    profileLinks: ProfileLinksInterface[] | [],
    profileImage: string | null,
    isUserActive: boolean,
    createdBy: {
        _id: string,
        email: string
    },
    createdAt: string,
    updatedAt: string
}

export interface ProfileLinksInterface {
    platform: string,
    url: string,
    username: string,
    isVerified: boolean,
}