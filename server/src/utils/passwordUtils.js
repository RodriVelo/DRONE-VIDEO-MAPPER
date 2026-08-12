import bcrypt from "bcrypt";

export const comparePassword = async (
  plainPassword,
  hashedPassword
) => {
  return await bcrypt.compare(
    plainPassword,
    hashedPassword
  );
};