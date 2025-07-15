const API_URL = process.env.API_URL!
export async function getFriends(): Promise<PublicUser[]> {
    const endpoint = `${API_URL}/api/v1/friends/`
    const response = fetch

    if (response.status === 200) {
        return response.data;
    } else {
        console.error("Failed to get friends:", response.data);
        return [];
    }
}