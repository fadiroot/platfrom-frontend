import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '@src/modules/shared/components/Button/Button';
import Input from '@src/modules/shared/components/Input/Input';
import { useNavigate } from 'react-router-dom';

const initialValues = {
  name: '',
  description: '',
};

const CreateLevel: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      name: Yup.string().required('Level name is required'),
      description: Yup.string().required('Description is required'),
    }),
    onSubmit: (values) => {
      setSubmitting(true);
      console.log('Creating level with values:', values);
      // Mock API call
      setTimeout(() => {
        setSubmitting(false);
        alert('Level created successfully!');
        navigate('/levels'); // Redirect to levels list
      }, 1000);
    },
  });

  return (
    <div className="create-level-module">
      <form className="create-level-card-container" onSubmit={formik.handleSubmit}>
        <h1 className="title">Create New Level</h1>

        <Input
          name="name"
          formik={formik}
          variant="secondary"
          placeholder="Enter level name"
          label="Level Name"
          required={true}
        />

        <Input
          name="description"
          formik={formik}
          variant="secondary"
          placeholder="Enter level description"
          label="Description"
          required={true}
        />

        <Button label={'Create Level'} type={'submit'} loading={submitting} />
      </form>
    </div>
  );
};

export default CreateLevel; 