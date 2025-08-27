/**
 * Permission utilities for the frontend
 * Based on the backend permission system
 */

// Permission constants - must match backend constants/permissions.ts
export const UserPermissions = {
  ADMINISTRATOR: BigInt(1) << BigInt(0),
  CREATE_NEW_PROBLEM: BigInt(1) << BigInt(25),
  EDIT_PROBLEM_TESTS: BigInt(1) << BigInt(33),
  // Add other permissions as needed
} as const;

export type PermissionBit = bigint;

/**
 * Check if a user has a specific permission
 * @param userPerms - User permissions as string (from backend)
 * @param permission - Permission bit to check
 * @returns true if user has permission
 */
export function hasPermission(
  userPerms: string | undefined,
  permission: PermissionBit,
): boolean {
  if (!userPerms) return false;

  try {
    const permBits = BigInt(userPerms);

    // Administrator has all permissions
    if ((permBits & UserPermissions.ADMINISTRATOR) !== BigInt(0)) {
      return true;
    }

    // Check specific permission
    return (permBits & permission) !== BigInt(0);
  } catch (error) {
    console.error("Error checking permissions:", error);
    return false;
  }
}

/**
 * Check if user can edit problem test cases
 * @param userPerms - User permissions
 * @param problemAuthors - Array of problem author IDs
 * @param problemCurators - Array of problem curator IDs
 * @param problemTesters - Array of problem tester IDs
 * @param userId - Current user ID
 * @returns true if user can edit test cases
 */
export function canEditProblemTestcases(
  userPerms: string | undefined,
  problemAuthors: string[],
  problemCurators: string[],
  problemTesters: string[],
  userId: string | undefined,
): boolean {
  if (!userId) return false;

  // Check global permission
  if (hasPermission(userPerms, UserPermissions.EDIT_PROBLEM_TESTS)) {
    return true;
  }

  // Check if user is author, curator, or tester
  return (
    problemAuthors.includes(userId) ||
    problemCurators.includes(userId) ||
    problemTesters.includes(userId)
  );
}
