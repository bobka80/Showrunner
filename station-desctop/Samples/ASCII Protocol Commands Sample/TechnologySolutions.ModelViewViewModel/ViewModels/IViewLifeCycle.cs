//-----------------------------------------------------------------------
// <copyright file="IViewLifeCycle.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.ViewModels
{
    using System;    
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Provides methods that are called on particular view life cycle events
    /// </summary>
    public interface IViewLifeCycle
    {
        /// <summary>
        /// Called when the view is activated (shown)
        /// </summary>
        void Activated();

        /// <summary>
        /// Called when the view is deactivated (hidden)
        /// </summary>
        void Deactivated();
    }
}
