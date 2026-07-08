//-----------------------------------------------------------------------
// <copyright file="ServiceProvider.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel
{
    using System;    
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Provides access to the <see cref="IServiceProvider"/>
    /// </summary>
    public static class ServiceProvider
    {
        /// <summary>
        /// Synchronizes access to the service provider
        /// </summary>
        private static object sync = new object();

        /// <summary>
        /// Backing field for Current
        /// </summary>
        private static IServiceProvider current;

        /// <summary>
        /// Gets or sets the current instance of the ServiceProvider
        /// </summary>
        public static IServiceProvider Current
        {
            get
            {
                lock (sync)
                {
                    if (current == null)
                    {
                        // TODO: default instance of service provider will do
                        current = new System.ComponentModel.Design.ServiceContainer();
                    }
                }

                return current;
            }

            set
            {
                lock (sync)
                {
                    current = value;
                }
            }
        }
    }
}
