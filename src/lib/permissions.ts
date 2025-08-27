/**
 * Permission utilities for the frontend
 * Based on the backend permission system
 */

// Permission constants - must match backend constants/permissions.ts
export const UserPermissions = {
  // Special
  ADMINISTRATOR: BigInt(1) << BigInt(0),

  // Web
  VIEW_MANAGEMENT_PAGE: BigInt(1) << BigInt(1),
  INVALIDATE_GLOBAL_CACHE: BigInt(1) << BigInt(2),

  // Roles, Permissions
  CREATE_ROLES: BigInt(1) << BigInt(3),
  MODIFY_ROLES_INFO: BigInt(1) << BigInt(4),
  MODIFY_ROLES_PERMISSIONS: BigInt(1) << BigInt(5),
  DELETE_ROLES: BigInt(1) << BigInt(6),

  // Users
  CHANGE_USER_STATUS: BigInt(1) << BigInt(7),
  MANAGE_USER_BANS: BigInt(1) << BigInt(8),
  RESET_USER_PASSWORD: BigInt(1) << BigInt(9),
  FORCE_CREATE_USERS: BigInt(1) << BigInt(10),
  EDIT_USERS_INFO: BigInt(1) << BigInt(11),
  EDIT_USERS_PERMISSIONS: BigInt(1) << BigInt(12),
  DELETE_USERS: BigInt(1) << BigInt(13),

  // Sessions
  INVALIDATE_USER_SESSIONS: BigInt(1) << BigInt(14),
  VIEW_USER_SESSIONS: BigInt(1) << BigInt(15),
  BAN_IP_CIDR: BigInt(1) << BigInt(16),

  // Submission
  VIEW_SUBMISSION_CODE: BigInt(1) << BigInt(17),
  VIEW_SUBMISSION_DETAILS: BigInt(1) << BigInt(18),
  REJUDGE_SUBMISSION: BigInt(1) << BigInt(19),
  EDIT_SUBMISSION: BigInt(1) << BigInt(20),
  SKIP_SUBMISSION: BigInt(1) << BigInt(21),
  UNLIMITED_SUBMISSIONS: BigInt(1) << BigInt(22),
  CHANGE_SUBMISSION_STATUS: BigInt(1) << BigInt(23), // active, aborted, locked

  // Problems
  VIEW_ALL_PROBLEMS: BigInt(1) << BigInt(24),
  CREATE_NEW_PROBLEM: BigInt(1) << BigInt(25),
  MODIFY_ALL_PROBLEMS: BigInt(1) << BigInt(26),
  MODIFY_PERMITTED_PROBLEMS: BigInt(1) << BigInt(27),
  CHANGE_PROBLEM_STATUS: BigInt(1) << BigInt(28), // locked, hidden, active
  DELETE_PROBLEM: BigInt(1) << BigInt(29),
  UPDATE_SOLUTIONS: BigInt(1) << BigInt(30),
  CLONE_PROBLEM: BigInt(1) << BigInt(31),
  EDIT_CLARIFICATIONS: BigInt(1) << BigInt(32),
  EDIT_PROBLEM_TESTS: BigInt(1) << BigInt(33),

  // Judge
  VIEW_ALL_JUDGES: BigInt(1) << BigInt(34),
  EDIT_JUDGES: BigInt(1) << BigInt(35),
  CREATE_NEW_JUDGE: BigInt(1) << BigInt(36),
  DELETE_JUDGES: BigInt(1) << BigInt(37),
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
