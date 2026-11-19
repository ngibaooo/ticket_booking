
package com.ticketbooking.dto.user;

//import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(

        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

// Thành phần	    Ý nghĩa
//      ^	        Bắt đầu chuỗi
//      0	        Phải bắt đầu bằng số 0
//      [0-9]	    Chỉ cho phép chữ số từ 0 đến 9
//      {9}	        Chính xác 9 chữ số tiếp theo
//      $	        Kết thúc chuỗi
        @Pattern(
                regexp = "^0[0-9]{9}$",
                message = "Phone must contain exactly 10 digits and start with 0"
        )
        String phone

) {
}
