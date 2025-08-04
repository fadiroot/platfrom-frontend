"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAppDispatch } from "../../../../modules/shared/store"
import { login } from "../../data/authThunk"
import { PATH } from "../../routes/paths"
import "./_Login.scss"

// Custom Input Component to match your original styling
interface InputProps {
  name: string
  formik: any
  placeholder?: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}

const Input = ({ name, formik, placeholder, label, type = "text", required, autoComplete }: InputProps) => {
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
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="input"
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
}

const Button = ({ type = "button", label, loading, children }: ButtonProps) => {
  return (
    <button type={type} className="Button-component" disabled={loading}>
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
  email: "",
  password: "",
}

const LoginComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
    }),
    onSubmit: (values) => {
      setSubmitting(true)
      dispatch(login(values))
        .unwrap()
        .then((result) => {
          
          if (result.user && result.user.level_id) {
            navigate(`/subjects?levelId=${result.user.level_id}`)
          } else {
            navigate('/subjects') // Fallback to subjects page
          }
        })
        .catch((err) => {
          alert(err?.message || "Login failed")
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  return (
    <div className="login-module">
      <div className="login-card-container">
        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Please sign in to your account</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          <Input
            name="email"
            formik={formik}
            placeholder="Your email"
            label="Email"
            required
            autoComplete="email"
          />
          {formik.touched.email && formik.errors.email && (
            <div className="error-text">{formik.errors.email}</div>
          )}

          <Input
            name="password"
            formik={formik}
            type="password"
            placeholder="••••••••"
            label="Password"
            required
            autoComplete="current-password"
          />
          {formik.touched.password && formik.errors.password && (
            <div className="error-text">{formik.errors.password}</div>
          )}

          <Button type="submit" label="Sign In" loading={submitting} />
        </form>

        <Link to={PATH.REGISTER} className="link">
          Don't have an account? Sign Up
        </Link>
      </div>
    </div>
  )
}

export default LoginComponent
