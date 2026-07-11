//-----------------------------------------------------------------------
// <copyright file="PropertyChangedViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    using System.Windows.Forms;

    /// <summary>
    /// Base class for view models that are going to use property changed notifications
    /// </summary>
    public abstract class PropertyChangedViewModel
        : INotifyPropertyChanged
    {
        /// <summary>
        /// Raised when the value of a property changes
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// Raises the <see cref="PropertyChanged"/> event
        /// </summary>
        /// <param name="propertyName">The name of the property where the value changed</param>
        protected virtual void OnPropertyChanged(string propertyName)
        {
            Dispatcher.InvokeIfRequired(() =>
            {
                PropertyChangedEventHandler handler;

                handler = this.PropertyChanged;
                if (handler != null)
                {
                    handler(this, new PropertyChangedEventArgs(propertyName));
                }
            });
        }

        /// <summary>
        /// If field does not equal value the sets field to value and raises a PropertyChanged event using propertyName.
        /// Returns true if the value was set and false if no change is required
        /// </summary>
        /// <typeparam name="T">The type of value to set</typeparam>
        /// <param name="field">The backing field for the property to check and possibly update</param>
        /// <param name="value">The new value for the property</param>
        /// <param name="propertyName">The name of the property</param>
        /// <returns>True if the value changed. False otherwise</returns>
        protected bool SetProperty<T>(ref T field, T value, string propertyName)
        {
            if (!object.Equals(field, value))
            {
                field = value;
                this.OnPropertyChanged(propertyName);
                return true;
            }

            return false;
        }
    }
}
