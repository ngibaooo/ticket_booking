
package com.ticketbooking.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

//Dùng record cho DTO thay vì class:
/*
- Thứ nhất: Record bất biến (immutable)
    + Với class thông thường, nếu có setter thì có thể thay đổi dữ liệu.
    + Nhưng với record, không thể thay đổi giá trị sau khi khởi tạo
    --> Không có setter
- Thứ hai: record tự sinh:
    - Constructor đầy đủ tham số.
    - Các accessor (id(), fullName(), email()).
    - equals().
    - hashCode().
    - toString().
    --> Không cần tự khai báo như class
- Thứ ba: Record vẫn là một class
    + vẫn có thể:
        - Khai báo method.
        - Sử dụng validation annotation.
        - Implement interface.
        - Khai báo constructor tùy chỉnh.
        Nhưng record không thể kế thừa một class khác, vì nó đã kế thừa java.lang.Record.
 */
public record LoginRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        String password

) {
}
