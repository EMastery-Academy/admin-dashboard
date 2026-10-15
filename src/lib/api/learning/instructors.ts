import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type DetailOp = "instructor_api_v1_legacy_instructors__instructor_id__get";
type CoursesOp = "instructor_courses_api_v1_legacy_instructors__instructor_id__courses_get";
type DiplomasOp = "instructor_diplomas_api_v1_legacy_instructors__instructor_id__diplomas_get";
type PackagesOp = "instructor_packages_api_v1_legacy_instructors__instructor_id__packages_get";
type CategoriesOp = "instructor_categories_api_v1_legacy_instructors__instructor_id__categories_get";
type SearchOp = "search_instructors_api_v1_search_instructors_get";
type AdminListOp = "list_instructors_api_v1_admin_instructors_get";
type AdminGetOp = "get_instructor_api_v1_admin_instructors__legacy_trainer_id__get";
type ApplicationsOp = "list_instructor_applications_api_v1_admin_instructors_applications_get";

export type InstructorDetail = SuccessResponse<DetailOp>;
export type Instructor = InstructorDetail["instructor"];
export type InstructorCourse = SuccessResponse<CoursesOp>["items"][number];
export type InstructorCoursePage = SuccessResponse<CoursesOp>;
export type InstructorPackage = SuccessResponse<PackagesOp>["items"][number];
export type InstructorCategory = SuccessResponse<CategoriesOp>["items"][number];
export type InstructorCategoryPage = SuccessResponse<CategoriesOp>;
export type InstructorListParams = QueryParams<SearchOp>;
export type InstructorListItem = SuccessResponse<SearchOp>[number];
/** Back-office instructor (`/admin/instructors`, legacy trainers). */
export type AdminInstructor = SuccessResponse<AdminGetOp>;
export type AdminInstructorsParams = QueryParams<AdminListOp>;
export type AdminInstructorPage = SuccessResponse<AdminListOp>;
export type InstructorApplicationsParams = QueryParams<ApplicationsOp>;
export type InstructorApplicationPage = SuccessResponse<ApplicationsOp>;
export type InstructorApplication = InstructorApplicationPage["items"][number];

export const instructorsPaths = {
  detail: "legacy/instructors/{instructor_id}",
  courses: "legacy/instructors/{instructor_id}/courses",
  diplomas: "legacy/instructors/{instructor_id}/diplomas",
  packages: "legacy/instructors/{instructor_id}/packages",
  categories: "legacy/instructors/{instructor_id}/categories",
  search: "search/instructors",
  adminList: "admin/instructors",
  adminDetail: "admin/instructors/{legacy_trainer_id}",
  applications: "admin/instructors/applications",
} as const;

export const instructorsKeys = {
  all: ["learning", "instructors"] as const,
  detail: (id: number) => [...instructorsKeys.all, "detail", id] as const,
  courses: (id: number) => [...instructorsKeys.all, "courses", id] as const,
  adminList: (params?: AdminInstructorsParams) => [...instructorsKeys.all, "admin-list", params ?? {}] as const,
  applications: (params?: InstructorApplicationsParams) =>
    [...instructorsKeys.all, "applications", params ?? {}] as const,
};

/** `GET /admin/instructors` — back-office instructor list (legacy trainers). */
export function listAdminInstructors(params: AdminInstructorsParams = {}): Promise<AdminInstructorPage> {
  return apiGet(instructorsPaths.adminList, { query: params });
}

export function getAdminInstructor(
  legacy_trainer_id: PathParams<AdminGetOp>["legacy_trainer_id"],
): Promise<AdminInstructor> {
  return apiGet(instructorsPaths.adminDetail, { path: { legacy_trainer_id } });
}

/** `GET /admin/instructors/applications` — applications to become an instructor, newest first. */
export function listInstructorApplications(
  params: InstructorApplicationsParams = {},
): Promise<InstructorApplicationPage> {
  return apiGet(instructorsPaths.applications, { query: params });
}

export function getInstructor(instructor_id: PathParams<DetailOp>["instructor_id"]): Promise<InstructorDetail> {
  return apiGet(instructorsPaths.detail, { path: { instructor_id } });
}

export function listInstructorCourses(instructor_id: PathParams<CoursesOp>["instructor_id"]): Promise<InstructorCoursePage> {
  return apiGet(instructorsPaths.courses, { path: { instructor_id } });
}

export function listInstructorPackages(instructor_id: PathParams<PackagesOp>["instructor_id"]): Promise<InstructorCoursePage> {
  return apiGet(instructorsPaths.packages, { path: { instructor_id } });
}

export function listInstructorDiplomas(instructor_id: PathParams<DiplomasOp>["instructor_id"]): Promise<InstructorCoursePage> {
  return apiGet(instructorsPaths.diplomas, { path: { instructor_id } });
}

export function listInstructorCategories(instructor_id: PathParams<CategoriesOp>["instructor_id"]): Promise<InstructorCategoryPage> {
  return apiGet(instructorsPaths.categories, { path: { instructor_id } });
}

export function listInstructors(params: InstructorListParams = {}): Promise<InstructorListItem[]> {
  return apiGet(instructorsPaths.search, { query: params });
}

export const instructorsQueries = {
  detail: (id: number) => queryOptions({ queryKey: instructorsKeys.detail(id), queryFn: () => getInstructor(id) }),
  courses: (id: number) => queryOptions({ queryKey: instructorsKeys.courses(id), queryFn: () => listInstructorCourses(id) }),
  adminList: (params?: AdminInstructorsParams) =>
    queryOptions({ queryKey: instructorsKeys.adminList(params), queryFn: () => listAdminInstructors(params) }),
  applications: (params?: InstructorApplicationsParams) =>
    queryOptions({ queryKey: instructorsKeys.applications(params), queryFn: () => listInstructorApplications(params) }),
};
