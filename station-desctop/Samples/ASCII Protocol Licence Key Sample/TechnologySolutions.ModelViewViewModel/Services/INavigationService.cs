//-----------------------------------------------------------------------
// <copyright file="INavigationService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Services
{
    using System;
    using System.Windows.Forms;

    /// <summary>
    /// Provides methods to navigate between views within an application
    /// </summary>
    public interface INavigationService
    {
        /// <summary>
        /// Gets the currently displayed view
        /// </summary>
        Form ActiveView { get; }

        /// <summary>
        /// Changes the currently displayed view to the one specified
        /// </summary>
        /// <param name="viewType">The type of view required</param>
        void NavigateTo(Type viewType);

        /// <summary>
        /// Changes the currently displayed view to the one specified
        /// </summary>
        /// <typeparam name="ViewType">The view required</typeparam>
        void NavigateTo<ViewType>() where ViewType : Form;

        /// <summary>
        /// Closes all views to exit the application
        /// </summary>
        void Exit();
    }
}
