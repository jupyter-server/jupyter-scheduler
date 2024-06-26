export interface ICollaborators {
  id: string;
  name: string;
  email: string;
  permissions?: Array<string> | null;
}

export type Contact = {
  id: string;
  name: string;
  email: string;
};
