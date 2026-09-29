## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Sat Sep 26 2026 13:26:54 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.32.0|
|**Generation Platform**<br>SAP Business Application Studio|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>UI|
|**Application Title**<br>App Title|
|**Namespace**<br>|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.152.0|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>True, see https://www.npmjs.com/package/@sap-ux/eslint-plugin-fiori-tools#rules for the eslint rules.|

## UI

An SAP Fiori application.

## Backend integration

The application uses the local or deployed Ability Passport CAP service. The backend defines `PassportService`, which is served at `/odata/v4/passport/` by the current CAP project configuration.

For BAS local preview, start with the destination name supplied by your subaccount:

```bash
FIORI_TOOLS_DESTINATION="<your-destination-name>" npm start
```

The UI consumes `Candidates`, `Tasks`, `Submissions`, `Verifications`, `Consents`, and `Decisions`, and invokes `submitWork`, `grantConsent`, and `passportFor` with the backend's exact parameter names. Passport access is intentionally controlled by the backend: a `NO_CONSENT` response is shown as an access message and never replaced with local or inferred data.

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)
