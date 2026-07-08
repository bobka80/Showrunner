//-----------------------------------------------------------------------
// <copyright file="Navigation.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel
{
    using System;
    using Services;

    /// <summary>
    /// Provides access to the application navigation
    /// </summary>
    public static class Navigation
    {
        /// <summary>
        /// Gets or sets the current navigation service to use for the application
        /// </summary>
        public static INavigationService Current { get; set; }
    }
}
