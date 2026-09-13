export interface BusinessInformation {
  companyName: string;
  representative: string;
  businessRegistrationNumber: string;
  ecommerceRegistrationNumber: string;
  address: string;
  contact: string;
  hostingProvider: string;
}

/** 확인되지 않은 사업자 정보를 꾸며 넣지 않는다. 빈 값은 UI에서 숨긴다. */
export const BUSINESS_INFORMATION: Readonly<BusinessInformation> = Object.freeze({
  companyName: "",
  representative: "",
  businessRegistrationNumber: "",
  ecommerceRegistrationNumber: "",
  address: "",
  contact: "",
  hostingProvider: "",
});

export const BUSINESS_INFO = BUSINESS_INFORMATION;
