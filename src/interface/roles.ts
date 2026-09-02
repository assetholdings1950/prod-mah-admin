export interface RoleInterface {
    _id: string,
    roleName: string,
    roleCode: string,
    contents: string[],
    createdAt: string,
    updatedAt: string,
    createdBy: {
        _id: string,
        email: string
    }
    __v: number
}