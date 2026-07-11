//-----------------------------------------------------------------------
// <copyright file="ServiceContainer.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace System.ComponentModel.Design
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Provides a simple implementation of the System.ComponentModel.Design.IServiceContainer interface. This class cannot be inherited.
    /// </summary>
    public class ServiceContainer
        : IServiceContainer, IServiceProvider, IDisposable
    {
        /// <summary>
        /// True once an instance of this class is disposed
        /// </summary>
        private bool disposed;

        /// <summary>
        /// Provides synchronisation to the methods
        /// </summary>
        private object syncLock = new object();

        /// <summary>
        /// The parent service conttainer
        /// </summary>
        private IServiceProvider parentProvider;

        /// <summary>
        /// The services this container provides
        /// </summary>
        private IDictionary<Type, object> services;

        /// <summary>
        /// Initializes a new instance of the ServiceContainer class.
        /// </summary>
        public ServiceContainer()
            : this(null)
        {
        }

        /// <summary>
        /// Initializes a new instance of the ServiceContainer class using the specified parent service provider.
        /// </summary>
        /// <param name="parentProvider">A parent service provider.</param>
        public ServiceContainer(IServiceProvider parentProvider)
        {
            this.parentProvider = parentProvider;
            this.services = new Dictionary<Type, object>();
        }

        /// <summary>
        /// Gets the default services implemented directly by ServiceContainer.
        /// </summary>
        protected virtual Type[] DefaultServices
        {
            get
            {
                IEnumerable<Type> serviceTypes;

                this.CheckDisposed();

                lock (this.syncLock)
                {
                    serviceTypes = this.services.Keys;
                }

                return serviceTypes.ToArray();
            }
        }

        /// <summary>
        /// Adds the specified service to the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to add.</param>
        /// <param name="serviceInstance">
        /// An instance of the service to add. This object must implement or inherit
        /// from the type indicated by the serviceType parameter.
        /// </param>
        /// <exception cref="ArgumentNullException">serviceType or serviceInstance is null.</exception>
        /// <exception cref="ArgumentException">A service of type serviceType already exists in the container.</exception>
        public void AddService(Type serviceType, object serviceInstance)
        {
            if (serviceType == null)
            {
                throw new ArgumentNullException("serviceType");
            }

            if (serviceInstance == null)
            {
                throw new ArgumentNullException("serviceInstance");
            }

            if (this.services.ContainsKey(serviceType))
            {
                throw new ArgumentException("A service of type serviceType already exists in the container");
            }

            this.CheckDisposed();

            lock (this.syncLock)
            {
                this.services.Add(serviceType, serviceInstance);
            }
        }

        /// <summary>
        /// Adds the specified service to the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to add.</param>
        /// <param name="callback">
        /// A callback object that can create the service. This allows a service to be
        /// declared as available, but delays creation of the object until the service
        /// is requested.
        /// </param>
        /// <exception cref="ArgumentNullException">serviceType or callback is null.</exception>
        /// <exception cref="ArgumentException">A service of type serviceType already exists in the container.</exception>
        public void AddService(Type serviceType, ServiceCreatorCallback callback)
        {
            if (serviceType == null)
            {
                throw new ArgumentNullException("serviceType");
            }

            if (callback == null)
            {
                throw new ArgumentNullException("callback");
            }

            if (this.services.ContainsKey(serviceType))
            {
                throw new ArgumentException("A service of type serviceType already exists in the container");
            }

            this.CheckDisposed();

            lock (this.syncLock)
            {
                this.services.Add(serviceType, callback);
            }
        }

        /// <summary>
        /// Adds the specified service to the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to add.</param>
        /// <param name="serviceInstance">
        /// An instance of the service type to add. This object must implement or inherit
        /// from the type indicated by the serviceType parameter.
        /// </param>
        /// <param name="promote">
        /// true if this service should be added to any parent service containers; otherwise, false.
        /// </param>
        /// <exception cref="ArgumentNullException">serviceType or serviceInstance is null.</exception>
        /// <exception cref="ArgumentException">A service of type serviceType already exists in the container.</exception>
        public virtual void AddService(Type serviceType, object serviceInstance, bool promote)
        {
            if (promote)
            {
                throw new NotSupportedException();
            }

            this.CheckDisposed();

            this.AddService(serviceType, serviceInstance);
        }

        /// <summary>
        /// Adds the specified service to the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to add.</param>
        /// <param name="callback">
        /// A callback object that can create the service. This allows a service to be
        /// declared as available, but delays creation of the object until the service
        /// is requested.
        /// </param>
        /// <param name="promote">
        /// true if this service should be added to any parent service containers; otherwise, false.
        /// </param>
        /// <exception cref="ArgumentNullException">serviceType or callback is null.</exception>
        /// <exception cref="ArgumentException">A service of type serviceType already exists in the container.</exception>
        public virtual void AddService(Type serviceType, ServiceCreatorCallback callback, bool promote)
        {
            if (promote)
            {
                throw new NotSupportedException();
            }

            this.CheckDisposed();

            this.AddService(serviceType, callback);
        }

        /// <summary>
        /// Disposes this service container.
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }        

        /// <summary>
        /// Gets the requested service.
        /// </summary>
        /// <param name="serviceType">The type of service to retrieve.</param>
        /// <returns>An instance of the service if it could be found, or null if it could not be found.</returns>
        public virtual object GetService(Type serviceType)
        {
            this.CheckDisposed();

            lock (this.syncLock)
            {
                if (this.services.ContainsKey(serviceType))
                {
                    object result;

                    result = this.services[serviceType];
                    if (typeof(ServiceCreatorCallback).Equals(result.GetType()))
                    {
                        result = ((ServiceCreatorCallback)result)(this, serviceType);
                        this.services[serviceType] = result;
                    }

                    return result;
                }
                else
                {
                    return null;
                }
            }
        }

        /// <summary>
        /// Removes the specified service type from the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to remove.</param>
        /// <exception cref="ArgumentNullException">serviceType is null.</exception>
        public void RemoveService(Type serviceType)
        {
            if (serviceType == null)
            {
                throw new ArgumentNullException("serviceType");
            }

            this.CheckDisposed();

            lock (this.syncLock)
            {
                if (this.services.ContainsKey(serviceType))
                {
                    this.services.Remove(serviceType);
                }
            }
        }

        /// <summary>
        /// Removes the specified service type from the service container.
        /// </summary>
        /// <param name="serviceType">The type of service to remove.</param>
        /// <param name="promote">true if this service should be removed from any parent service containers;otherwise, false.</param>
        /// <exception cref="ArgumentNullException">serviceType is null.</exception>
        public virtual void RemoveService(Type serviceType, bool promote)
        {
            if (promote)
            {
                throw new NotSupportedException();
            }

            this.CheckDisposed();

            this.RemoveService(serviceType);
        }

        /// <summary>
        /// Disposes this service container.
        /// </summary>
        /// <param name="disposing">
        /// true if the System.ComponentModel.Design.ServiceContainer is in the process of being disposed of; otherwise, false.
        /// </param>
        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    object[] values;

                    this.disposed = true;

                    // dispose in reverse order so dependent objects disposed last
                    values = new List<object>(this.services.Values).ToArray();
                    Array.Reverse(values);

                    foreach (object value in values)
                    {
                        IDisposable dispose;

                        dispose = value as IDisposable;
                        if (dispose != null)
                        {
                            dispose.Dispose();
                        }
                    }
                }

                this.disposed = true;
            }
        }

        /// <summary>
        /// Throws an ObjectDisposedException if this instance has been disposed
        /// </summary>
        private void CheckDisposed()
        {
            if (this.disposed)
            {
                throw new ObjectDisposedException(this.GetType().FullName);
            }
        }
    }
}
