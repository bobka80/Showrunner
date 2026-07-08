//-----------------------------------------------------------------------
// <copyright file="ServiceProviderExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Extensions methods for the IServiceProvider
    /// </summary>
    public static class ServiceProviderExtensions
    {
        /// <summary>
        /// Gets the instanec of the service type requested
        /// </summary>
        /// <typeparam name="TService">The type of service required</typeparam>
        /// <param name="value">The service provider</param>
        /// <returns>The instance of the requested service or null if the service cannot be provided</returns>
        public static TService Get<TService>(this IServiceProvider value)
        {
            return (TService)value.GetService(typeof(TService));
        }
    }
}
