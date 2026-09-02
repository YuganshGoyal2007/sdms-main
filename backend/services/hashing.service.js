import bcrypt from 'bcryptjs';

export const verifyPassword = async ( password, hashedPassword ) => {
    return await bcrypt.compare(password, hashedPassword)
}