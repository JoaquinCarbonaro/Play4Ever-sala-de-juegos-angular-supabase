//interface con los datos que trae github
export interface GithubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  location?: string | null;
  blog?: string | null;
  public_repos?: number;
  followers?: number;
  following?: number;
  created_at?: string;
}