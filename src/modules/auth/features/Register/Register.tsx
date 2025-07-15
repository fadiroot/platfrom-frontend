"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAppDispatch } from "../../../../modules/shared/store"
import { register } from "../../data/authThunk"
import { getChangedValues } from "../../../../modules/shared/utils/getChangedValuesFormik"
import { PATH } from "../../routes/paths"
import "./_Register.scss"

// Custom Input Component to match your original styling
interface InputProps {
  name: string
  formik: any
  placeholder?: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  variant?: string
  className?: string
}

const Input = ({ name, formik, placeholder, label, type = "text", required, autoComplete, className }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="Input-component-wrapper">
      <label htmlFor={name} className="label">
        {label} {required && "*"}
      </label>
      <div className="input-container">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={formik.values[name] || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`input ${className || ""}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

// Custom Button Component to match your original styling
interface ButtonProps {
  type?: "button" | "submit"
  label?: string
  loading?: boolean
  children?: React.ReactNode
  className?: string
}

const Button = ({ type = "button", label, loading, children, className }: ButtonProps) => {
  return (
    <button type={type} className={`Button-component ${className || ""}`} disabled={loading}>
      {loading ? (
        <>
          <Loader2 size={18} className="spinner" />
          {label || children}
        </>
      ) : (
        label || children
      )}
    </button>
  )
}

const initialValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  age: null,
  birthDate: null,
}

const RegisterComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      username: Yup.string().required("Username is required"),
      email: Yup.string()
        .email("Invalid email address")
        .matches(/^([a-zA-Z0-9._%+-]+)@((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/, "Invalid email address")
        .test(
          "no-special-chars",
          "Email contains disallowed characters",
          (value: string | undefined) => !value || /^[^<>()\\/\[\]{}\s]+@[^\s]+$/.test(value),
        )
        .required("Email is required"),
      password: Yup.string().required("Password is required").min(6, "Password is too short!"),
      confirmPassword: Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
      phoneNumber: Yup.string()
        .required("Phone number is required")
        .matches(/^[2459]\d{7}$/, "Phone number must be 8 digits and start with 2, 4, 5, or 9"),
    }),
    onSubmit: (values) => {
      setSubmitting(true)
      // Map form values to API DTO
      const payload = {
        Email: values.email,
        PhoneNumber: values.phoneNumber,
        UserName: values.username,
        Password: values.password,
        ConfirmPassword: values.confirmPassword,
      }
      dispatch(register(payload))
        .unwrap()
        .then(() => {
          console.log("Account created successfully")
          navigate(PATH.LOGIN)
        })
        .catch((err: { message: any }) => {
          alert(err?.message || "Something went wrong")
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  return (
    <div className="register-module">
      <div className="register-card-container">
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Join us today and get started</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          {/* Row 1: Email */}
          <div className="form-row single">
            <div className="form-field">
              <Input
                name="email"
                formik={formik}
                type="email"
                placeholder="Enter your email"
                label="Email"
                required
                autoComplete="email"
              />
              {formik.touched.email && formik.errors.email && <div className="error-text">{formik.errors.email}</div>}
            </div>
          </div>

          {/* Row 2: Username */}
          <div className="form-row single">
            <div className="form-field">
              <Input
                name="username"
                formik={formik}
                placeholder="Enter your username"
                label="Username"
                required
                autoComplete="username"
              />
              {formik.touched.username && formik.errors.username && (
                <div className="error-text">{formik.errors.username}</div>
              )}
            </div>
          </div>

          {/* Row 3: Phone Number */}
          <div className="form-row single">
            <div className="form-field">
              <Input
                name="phoneNumber"
                formik={formik}
                type="text"
                placeholder="Enter your phone number"
                label="Phone Number"
                required
                autoComplete="tel"
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <div className="error-text">{formik.errors.phoneNumber}</div>
              )}
            </div>
          </div>

          {/* Row 4: Password & Confirm Password */}
          <div className="form-row">
            <div className="form-field">
              <Input
                name="password"
                formik={formik}
                type="password"
                placeholder="Enter your password"
                label="Password"
                required
                autoComplete="new-password"
              />
              {formik.touched.password && formik.errors.password && (
                <div className="error-text">{formik.errors.password}</div>
              )}
            </div>

            <div className="form-field">
              <Input
                name="confirmPassword"
                formik={formik}
                type="password"
                placeholder="Confirm your password"
                label="Confirm Password"
                required
                autoComplete="new-password"
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="error-text">{formik.errors.confirmPassword}</div>
              )}
            </div>
          </div>

          <Button type="submit" label="Create Account" loading={submitting} />
        </form>

        <Link to={PATH.LOGIN} className="link">
          Already have an account? Sign In
        </Link>
      </div>
    </div>
  )
}

export default RegisterComponent
