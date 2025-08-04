"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "../../../shared/store"
import { register } from "../../data/authThunk"
import { PATH } from "../../routes/paths"
import { fetchLevels } from "../../../levels/data/levelThunk"
import { Level } from "../../../levels/data/levelTypes"
import CustomSelect from "../../../shared/components/CustomSelect/CustomSelect"
import "./_Register.scss"

const initialValues = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  age: null,
  birthDate: null,
  levelId: "",
}

const RegisterComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { levels, loading: levelsLoading } = useAppSelector((state: any) => state.levels)

  useEffect(() => {
    dispatch(fetchLevels())
  }, [dispatch])

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      username: Yup.string().required("Username is required"),
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
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
      levelId: Yup.string().required("Level is required"),
    }),
    onSubmit: (values) => {
      setSubmitting(true)
      // Map form values to API DTO
      const payload = {
        email: values.email,
        phoneNumber: values.phoneNumber,
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        levelId: values.levelId,
        firstName: values.firstName,
        lastName: values.lastName,
      }
      dispatch(register(payload))
        .unwrap()
        .then((result) => {
          console.log("Account created successfully")
          navigate(`/subjects?levelId=${result.user.levelId}`)
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
          {/* Row 1: First Name and Last Name */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName" className="label">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                autoComplete="given-name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <div className="error-text">{formik.errors.firstName}</div>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="lastName" className="label">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                autoComplete="family-name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <div className="error-text">{formik.errors.lastName}</div>
              )}
            </div>
          </div>
          {/* Row 2: Level */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="levelId" className="label">
                Level *
              </label>
              <CustomSelect
                options={levels.map((level: Level) => ({
                  value: level.id,
                  label: level.title,
                }))}
                value={formik.values.levelId}
                onChange={(value: string) => formik.setFieldValue("levelId", value)}
                onBlur={() => formik.setFieldTouched("levelId", true)}
                placeholder="Select a level"
                disabled={levelsLoading}
              />
              {formik.touched.levelId && formik.errors.levelId && (
                <div className="error-text">{formik.errors.levelId}</div>
              )}
            </div>
          </div>
          {/* Row 3: Email */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.email && formik.errors.email && <div className="error-text">{formik.errors.email}</div>}
            </div>
          </div>

          {/* Row 4: Username */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="username" className="label">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.username && formik.errors.username && (
                <div className="error-text">{formik.errors.username}</div>
              )}
            </div>
          </div>

          {/* Row 5: Phone Number */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="phoneNumber" className="label">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                placeholder="Enter your phone number"
                autoComplete="tel"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <div className="error-text">{formik.errors.phoneNumber}</div>
              )}
            </div>
          </div>

          {/* Row 6: Password & Confirm Password */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="password" aria-label="Password" className="label">
                Password *
              </label>
              <div className="input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <div className="error-text">{formik.errors.password}</div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" aria-label="Confirm Password" className="label">
                Confirm Password *
              </label>
              <div className="input-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="error-text">{formik.errors.confirmPassword}</div>
              )}
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <Link to={PATH.LOGIN} className="link">
          Already have an account? Sign In
        </Link>
      </div>
    </div>
  )
}

export default RegisterComponent
