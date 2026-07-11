//-----------------------------------------------------------------------
// <copyright file="ViewModelLocator.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.ModelViewViewModel;

    /// <summary>
    /// Provides the ViewModels for the Views
    /// </summary>
    public static class ViewModelLocator
    {
        /// <summary>
        /// Uses the <see cref="ServiceProvider"/> to provide the requested ViewModel for the View
        /// </summary>
        /// <typeparam name="TViewModel">The type of view model required</typeparam>
        /// <returns>The requested view model instance</returns>
        public static TViewModel ViewModel<TViewModel>()
        {
            return ServiceProvider.Current.Get<TViewModel>();
        }        
    }
}
