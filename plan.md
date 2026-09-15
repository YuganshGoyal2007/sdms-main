# Implementation Plan

1. **Bulk Upload Destructive Overwrite**:
   - In `student.controller.js`, modify `processStudentRows` and `processStudentObjects`.
   - Instead of overwriting with default values, filter the `studentDoc` object to only include keys that were explicitly present in the Excel file headers (using `Object.values(headerMapping)`).

2. **Photo Upload by Enrollment Number**:
   - In `excel.controller.js` (`uploadStudentPhotosController`), lookup by either `rollNo` or `enrollmentNo` using `Op.or`.

3. **Excel Export Option (Photos)**:
   - Add a query parameter `?withPhotos=true` to the export endpoint.
   - Conditionally include the photo buffer in the export if requested.

4. **Photo Viewing/Changing in Student Edit**:
   - Update frontend components (`StudentForm`, `StudentEdit`) to include a photo preview and upload widget.
   - Create a backend route `PUT /update-student-photo/:id` if not exists.

5. **Roll Number Normalization**:
   - Create a util function `normalizeIdentifier(id)` that strips `/`, `-`, ` ` using regex.
   - Apply in controllers during upload and export.

6. **Photo Format Normalization (PNG)**:
   - Use `sharp` in `photoUpload.service.js` to convert buffers to PNG before saving to DB.

7. **Security Audit**:
   - Review Multer setup to ensure no path traversal.
   - Limit file sizes and validate magic bytes.

8. **Regression Prevention**:
   - Setup a `jest` test suite or a pre-commit hook using `husky` and `lint-staged`.
