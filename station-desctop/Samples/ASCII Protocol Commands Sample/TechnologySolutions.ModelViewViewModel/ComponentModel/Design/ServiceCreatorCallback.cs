//-----------------------------------------------------------------------
// <copyright file="ServiceCreatorCallback.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace System.ComponentModel.Design
{
    using System;
    using System.Runtime.InteropServices;

    /// <summary>
    /// Provides a callback mechanism that can create an instance of a service on demand.
    /// </summary>
    /// <param name="container">The service container that requested the creation of the service.</param>
    /// <param name="serviceType">The type of service to create.</param>
    /// <returns>The service specified by serviceType, or null if the service could not be created.</returns>
    [ComVisible(true)]
    public delegate object ServiceCreatorCallback(IServiceContainer container, Type serviceType);
}
