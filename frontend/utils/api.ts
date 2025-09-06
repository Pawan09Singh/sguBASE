// Utility API functions for frontend

export async function fetchCourseVideos(courseId: string, token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/videos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch videos');
  return response.json();
}
