package com.devs.nisha.exception

import org.springframework.http.HttpStatus

class BusinessException(
    message: String,
    val status: HttpStatus = HttpStatus.BAD_REQUEST,
) : RuntimeException(message)
