export interface ArchivoDriveGoogle {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
}

export interface ArchivoAdjuntoDrive {
  nombre: string;
  url: string;
  tipo: string;
  tamano?: string;
}

export function cargarGoogleIdentityServices(): Promise<void>;
export function solicitarTokenDrive(clientId: string): Promise<string>;
export function listarArchivosDrive(accessToken: string): Promise<ArchivoDriveGoogle[]>;
export function convertirArchivoDrive(archivo: ArchivoDriveGoogle): ArchivoAdjuntoDrive;

declare global {
  var google: {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string; error?: string }) => void;
        }): { requestAccessToken: () => void };
      };
    };
  } | undefined;
}
