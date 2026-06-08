import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

const notify = {
  success: (message) =>
    Toast.fire({
      icon: 'success',
      title: message,
    }),

  error: (message) =>
    Toast.fire({
      icon: 'error',
      title: message,
    }),

  warning: (message) =>
    Toast.fire({
      icon: 'warning',
      title: message,
    }),

  info: (message) =>
    Toast.fire({
      icon: 'info',
      title: message,
    }),

  confirm: async ({
    title = 'Are you sure?',
    text = "You won't be able to revert this!",
    confirmButtonText = 'Yes, delete it',
    cancelButtonText = 'Cancel',
    icon = 'warning',
  } = {}) => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });
    return result.isConfirmed;
  },
};

export default notify;
