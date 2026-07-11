//-----------------------------------------------------------------------
// <copyright file="PropertyChangedViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample
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
            Control control;

            control = System.Windows.Forms.Form.ActiveForm;
            if ((control != null) && control.InvokeRequired)
            {
                control.Invoke(new Action<string>(this.OnPropertyChanged), new object[] { propertyName });
            }
            else
            {
                PropertyChangedEventHandler handler;

                handler = this.PropertyChanged;
                if (handler != null)
                {
                    handler(this, new PropertyChangedEventArgs(propertyName));
                }
            }
        }        
    }
}
