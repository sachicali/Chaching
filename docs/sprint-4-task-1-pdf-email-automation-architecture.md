# Architecture: PDF Invoice Generation & Email Automation

**Confidence Rating: 9/10**

---

### 1. Overall System Architecture

This diagram illustrates how the new PDF and Email services will integrate with the existing Chaching platform architecture. The flow is initiated from the UI, processed through the service layer, and leverages Firebase for backend operations.

```mermaid
flowchart TD
    subgraph Frontend (Next.js)
        A[Invoice UI Components] -->|1. "Generate & Send"| B(InvoiceContext)
        B -->|2. Calls Service| C(InvoiceService)
    end

    subgraph Backend (Firebase)
        C -->|3. Get Invoice Data| D{Firestore: /invoices}
        C -->|4. Trigger PDF Generation| E[Cloud Function: generatePdf]
        E -->|5. Render PDF Template| F[React-PDF Templates]
        F -->|6. Generates PDF| E
        E -->|7. Upload PDF| G[Firebase Storage]
        G -->|8. Returns URL| E
        E -->|9. Returns URL| C
        C -->|10. Trigger Email| H{Firestore: /mail}
        H -->|11. Listens for new doc| I(Firebase Extension: Trigger Email)
        I -->|12. Sends Email w/ PDF| J[SMTP Provider]
    end

    J --> K[Client's Email]

    style C fill:#C7B4D3,stroke:#7851A9,stroke-width:2px
    style F fill:#C7B4D3,stroke:#7851A9,stroke-width:2px
    style I fill:#F59E0B,stroke:#7851A9,stroke-width:2px
    style E fill:#F59E0B,stroke:#7851A9,stroke-width:2px
```

---

### 2. PDF Generation System Architecture

This system is designed to be robust, template-driven, and scalable, using `react-pdf` for seamless integration with the existing React-based component architecture.

-   **Library Selection**: **`react-pdf/renderer`**
    -   **Rationale**: Allows creating PDF documents using React components. This aligns perfectly with the existing technology stack, enabling rapid development of professional and dynamic templates. It avoids the complexity of running a headless browser like Puppeteer in a serverless environment.

-   **Template Engine**: **React Components**
    -   **Location**: A new directory `src/components/invoices/pdf-templates/` will house the PDF templates.
    -   **Structure**: Each template (e.g., `ProfessionalTemplate.tsx`, `ModernTemplate.tsx`) will be a React component that accepts the `Invoice` object as a prop and uses `react-pdf` components (`<Page>`, `<View>`, `<Text>`, `<Image>`) to render the layout.
    -   **Dynamic Content**: The templates will dynamically render all invoice data, including business logos, client details, line items, and tax information, ensuring compliance with Philippines business standards (12% VAT).

-   **Integration & Workflow**:
    1.  **Asynchronous Generation**: PDF generation will be handled by a dedicated **Firebase Cloud Function** (`generatePdf`) to prevent blocking the main application thread and ensure scalability.
    2.  **Service Layer**: A new `PdfService` will be created. `InvoiceService` will call `PdfService.generateInvoicePdf(invoice)`.
    3.  **The `generateInvoicePdf` function will**:
        -   Fetch the specified invoice data from Firestore.
        -   Select the appropriate React-PDF template component based on `invoice.templateId`.
        -   Use `ReactPDF.renderToStream()` to generate the PDF buffer.
        -   Upload the buffer to Firebase Storage.
        -   Update the corresponding invoice document in Firestore with the PDF URL and a `generatedAt` timestamp.

---

### 3. Email Automation Service Architecture

This architecture leverages the **Trigger Email Firebase Extension** for a reliable, serverless email delivery system.

-   **Email Service Provider**: **Firebase Extensions (Trigger Email)**
    -   **Rationale**: Chosen for its seamless integration with Firestore, minimal setup, and inherent scalability. It eliminates the need to manage a separate email service or API keys directly in the application code.

-   **Workflow**:
    1.  **Trigger**: The `InvoiceService.sendInvoice()` method will create a new document in a dedicated `mail` collection in Firestore.
    2.  **Payload**: The document will contain the email details: `to`, `subject`, `html` (rendered from an email template), and an `attachments` array containing the public URL of the generated PDF invoice from Firebase Storage.
    3.  **Execution**: The Trigger Email extension automatically listens for new documents in the `mail` collection, processes them, and sends the email via a pre-configured SMTP provider (e.g., SendGrid, Mailgun).
    4.  **Tracking**: The extension updates the document in the `mail` collection with delivery status (`SUCCESS`, `ERROR`, etc.). A new `emailHistory` subcollection on the invoice document will log these statuses for client communication tracking.

-   **Template Management**:
    -   A new Firestore collection, `emailTemplates`, will store Handlebars email templates.
    -   Each document will contain templates for scenarios like `newInvoice`, `overdueReminder`, and `paymentConfirmation`.
    -   The `InvoiceService` will fetch the appropriate template, populate it with dynamic data (client name, invoice total, due date), and write the rendered HTML to the `mail` document.

---

### 4. Integration Strategy with Existing System

The new features will be seamlessly integrated into the existing production-ready application.

-   **`InvoiceService` Enhancement**:
    -   **`generateAndStorePdf(invoiceId)`**: A new private method to orchestrate calling the `generatePdf` Cloud Function and waiting for the result.
    -   **`sendInvoice(invoiceId, emailData)`**: This method will be fully implemented. It will first call `generateAndStorePdf`, then create the document in the `mail` collection to trigger the email.

-   **`InvoiceContext` Enhancement**:
    -   **`generateInvoicePDF(invoice)`**: Will be implemented to call the `InvoiceService` method, providing a way for users to download the PDF directly. It will return a Blob for client-side download.
    -   **`sendInvoice(id, emailData)`**: Will be implemented to call the corresponding service method.

-   **UI Component Updates** (`src/app/(app)/invoices/page.tsx`):
    -   The "Send" button will be enabled, triggering the `sendInvoice` context method.
    -   A "Download PDF" option will be added to the invoice actions menu.
    -   A new status indicator will be added to the invoice detail view to show email status (e.g., `Sent`, `Viewed`, `Bounced`) based on the `emailHistory` subcollection.

---

### 5. File Storage, Performance, and Security

-   **File Storage (Firebase Storage)**:
    -   **Path**: PDFs will be stored at `invoices/{userId}/{invoiceId}/invoice.pdf`.
    -   **Security Rules**: Storage rules will be configured to allow:
        -   `write` access only to the authenticated user (via the Cloud Function).
        -   `read` access only to the authenticated user.
        -   Public read access will be granted via short-lived signed URLs for email attachments and direct downloads to ensure security.

-   **Performance & Scalability**:
    -   **Asynchronous Operations**: Both PDF generation (Cloud Function) and email sending (Firebase Extension) are asynchronous, ensuring the UI remains responsive.
    -   **Scalability**: Firebase's serverless infrastructure will automatically scale to handle high volumes of invoice generation and email sending without manual intervention.

-   **Security & Compliance**:
    -   **Sensitive Data**: Client financial data is handled securely within the Firebase ecosystem. The PDF is the primary vehicle for data, attached securely to the email.
    -   **Access Control**: Firestore and Firebase Storage security rules will enforce strict access control, ensuring users can only access their own financial data.