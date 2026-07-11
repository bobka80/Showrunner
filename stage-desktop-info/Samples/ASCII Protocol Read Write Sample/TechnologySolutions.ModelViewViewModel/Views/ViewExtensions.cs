//-----------------------------------------------------------------------
// <copyright file="ViewExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using ViewModels;

    /// <summary>
    /// Helper methods for views
    /// </summary>
    public static class ViewExtensions
    {
        /// <summary>
        /// Wires a <see cref="IViewLifeCycle"/> view model to a form
        /// </summary>
        /// <param name="form">The form to register the life cycle events of</param>
        /// <param name="viewModel">The view model to notify of the life cycle events</param>
        public static void RegisterLifeCycleWith(this System.Windows.Forms.Form form, IViewLifeCycle viewModel)
        {
            if ((form != null) && (viewModel != null))
            {
                form.Activated += delegate(object sender, EventArgs e) { viewModel.Activated(); };
                form.Deactivate += delegate(object sender, EventArgs e) { viewModel.Deactivated(); };
            }
        }
    }
}
