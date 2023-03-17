export interface IFacebookUserInfo {
  email: string;
  first_name: string;
  last_name: string;
  id: string;
  picture: {
    data: {
      height: number;
      url: URL;
      width: number;
    };
  };
}
